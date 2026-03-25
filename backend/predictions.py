from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from .config import load_config
from .database import delete_pick, fetch_game, fetch_games, fetch_picks, fetch_users, upsert_pick
from .importer import dedupe_game_rows, format_game_response, matchup_key, to_int, to_text, utc_now_iso

VALID_PICK_SIDES = {"home", "away"}
LOCKED_GAME_STATUSES = {"live", "final", "postponed", "cancelled"}


class PredictionServiceError(Exception):
    """Base class for prediction backend errors."""


class PredictionValidationError(PredictionServiceError):
    """Raised when a request payload or query is invalid."""


class PredictionNotFoundError(PredictionServiceError):
    """Raised when a user, game, or pick cannot be found."""


class PredictionLockedError(PredictionServiceError):
    """Raised when a pick can no longer be edited."""


def parse_kickoff(value: str | None) -> datetime | None:
    if not value:
        return None

    normalized = value.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


def normalize_pick_side(value: Any) -> str:
    if not isinstance(value, str):
        raise PredictionValidationError("Pick must be 'home' or 'away'.")

    normalized = value.strip().lower()
    aliases = {
        "home": "home",
        "away": "away",
        "hometeam": "home",
        "awayteam": "away",
    }
    canonical = aliases.get(normalized)
    if canonical not in VALID_PICK_SIDES:
        raise PredictionValidationError("Pick must be 'home' or 'away'.")

    return canonical


def normalize_status(value: Any) -> str:
    return (to_text(value, "") or "").strip().lower()


def game_key_for_row(game_row: dict[str, Any]) -> str:
    return matchup_key(game_row)


def validate_user_id(user_id: str) -> str:
    try:
        return str(UUID(user_id))
    except (TypeError, ValueError, AttributeError) as exc:
        raise PredictionValidationError("userId must be a valid UUID.") from exc


def serialize_user_profile(user_row: dict[str, Any]) -> dict[str, Any]:
    first_name = to_text(user_row.get("first_name"))
    last_name = to_text(user_row.get("last_name"))
    username = to_text(user_row.get("username"), "unknown") or "unknown"

    full_name_parts = [part for part in (first_name, last_name) if part]
    display_name = " ".join(full_name_parts) if full_name_parts else username

    return {
        "id": user_row.get("id"),
        "username": username,
        "firstName": first_name,
        "lastName": last_name,
        "displayName": display_name,
        "role": user_row.get("role"),
    }


def build_games_index(
    *,
    season_year: int | None,
    week: int | None,
) -> dict[str, dict[str, Any]]:
    game_limit = 400 if week is None else 64
    rows = dedupe_game_rows(
        fetch_games(
            season_year=season_year,
            week=week,
            limit=game_limit,
            config=load_config(),
        )
    )
    return {game_key_for_row(row): row for row in rows}


def get_user_profile(user_id: str) -> dict[str, Any]:
    normalized_user_id = validate_user_id(user_id)
    users = fetch_users(user_ids=[normalized_user_id], limit=1, config=load_config())
    if not users:
        raise PredictionNotFoundError("User not found.")
    return users[0]


def resolve_game_row(game_identifier: str | None = None, external_id: str | None = None) -> dict[str, Any]:
    if not game_identifier and not external_id:
        raise PredictionValidationError("A game identifier is required.")

    config = load_config()
    game_row: dict[str, Any] | None = None

    if game_identifier:
        game_row = fetch_game(game_key=game_identifier, config=config)
        if not game_row:
            game_row = fetch_game(external_id=game_identifier, config=config)

    if not game_row and external_id:
        game_row = fetch_game(external_id=external_id, config=config)

    if not game_row:
        raise PredictionNotFoundError("Game not found.")

    return game_row


def result_summary_for_game(game_row: dict[str, Any]) -> dict[str, Any]:
    home_team = game_row.get("home_team") or {}
    away_team = game_row.get("away_team") or {}
    home_score = to_int(home_team.get("score"))
    away_score = to_int(away_team.get("score"))
    status = normalize_status(game_row.get("status"))

    summary = {
        "state": status or "scheduled",
        "winnerSide": None,
        "homeScore": home_score,
        "awayScore": away_score,
    }

    if status == "final":
        if home_score is None or away_score is None:
            return summary
        if home_score > away_score:
            summary["winnerSide"] = "home"
        elif away_score > home_score:
            summary["winnerSide"] = "away"
        return summary

    return summary


def is_game_locked(game_row: dict[str, Any]) -> bool:
    status = normalize_status(game_row.get("status"))
    if status in LOCKED_GAME_STATUSES:
        return True

    kickoff = parse_kickoff(to_text(game_row.get("kickoff_time")))
    return kickoff is not None and kickoff <= datetime.now(timezone.utc)


def pick_result_status(pick_side: str, game_row: dict[str, Any] | None) -> str:
    if not game_row:
        return "missing"

    result_summary = result_summary_for_game(game_row)
    state = result_summary["state"]
    winner_side = result_summary["winnerSide"]

    if state == "final":
        if winner_side is None:
            return "push"
        return "correct" if pick_side == winner_side else "incorrect"
    if state in {"postponed", "cancelled"}:
        return state
    if state == "live":
        return "live"
    return "pending"


def picked_team_snapshot(game_row: dict[str, Any], pick_side: str) -> dict[str, Any]:
    team = (game_row.get("home_team") or {}) if pick_side == "home" else (game_row.get("away_team") or {})
    return {
        "external_id": team.get("external_id"),
        "display_name": team.get("display_name") or team.get("name"),
        "short_name": team.get("short_name"),
        "abbreviation": team.get("abbreviation"),
        "logo_url": team.get("logo_url"),
        "record": team.get("record"),
    }


def serialize_pick_response(pick_row: dict[str, Any], game_row: dict[str, Any] | None) -> dict[str, Any]:
    game_payload = format_game_response(game_row) if game_row else None
    result_summary = result_summary_for_game(game_row) if game_row else {
        "state": "missing",
        "winnerSide": None,
        "homeScore": None,
        "awayScore": None,
    }
    pick_side = normalize_pick_side(pick_row.get("pick_side"))
    result = pick_result_status(pick_side, game_row)

    return {
        "userId": pick_row.get("user_id"),
        "gameId": pick_row.get("game_key"),
        "gameKey": pick_row.get("game_key"),
        "externalId": pick_row.get("game_external_id"),
        "season": pick_row.get("season_year"),
        "week": pick_row.get("week"),
        "pick": pick_side,
        "pickedTeam": {
            "id": pick_row.get("picked_team", {}).get("external_id"),
            "name": pick_row.get("picked_team", {}).get("display_name"),
            "shortName": pick_row.get("picked_team", {}).get("short_name"),
            "abbreviation": pick_row.get("picked_team", {}).get("abbreviation"),
            "logo": pick_row.get("picked_team", {}).get("logo_url"),
            "record": pick_row.get("picked_team", {}).get("record"),
        },
        "result": result,
        "winnerSide": result_summary["winnerSide"],
        "gameStatus": result_summary["state"],
        "locked": bool(game_row and is_game_locked(game_row)),
        "createdAt": pick_row.get("created_at"),
        "updatedAt": pick_row.get("updated_at"),
        "game": game_payload,
    }


def summarize_pick_results(picks: list[dict[str, Any]]) -> dict[str, Any]:
    summary = {
        "total": len(picks),
        "correct": 0,
        "incorrect": 0,
        "pending": 0,
        "pushes": 0,
        "live": 0,
        "cancelled": 0,
        "postponed": 0,
        "missing": 0,
    }

    for pick in picks:
        result = pick.get("result")
        if result == "correct":
            summary["correct"] += 1
        elif result == "incorrect":
            summary["incorrect"] += 1
        elif result == "push":
            summary["pushes"] += 1
        elif result == "live":
            summary["live"] += 1
        elif result == "cancelled":
            summary["cancelled"] += 1
        elif result == "postponed":
            summary["postponed"] += 1
        elif result == "missing":
            summary["missing"] += 1
        else:
            summary["pending"] += 1

    settled = summary["correct"] + summary["incorrect"]
    summary["settled"] = settled
    summary["winPct"] = round(summary["correct"] / settled, 3) if settled else None
    return summary


def list_user_picks(
    *,
    user_id: str,
    season_year: int | None,
    week: int | None,
    limit: int | None = 128,
) -> dict[str, Any]:
    config = load_config()
    normalized_user_id = validate_user_id(user_id)
    user_row = get_user_profile(normalized_user_id)
    pick_rows = fetch_picks(
        season_year=season_year,
        week=week,
        user_id=normalized_user_id,
        limit=limit,
        config=config,
    )
    games_by_key = build_games_index(season_year=season_year, week=week)

    picks = [
        serialize_pick_response(pick_row, games_by_key.get(pick_row.get("game_key")))
        for pick_row in pick_rows
    ]
    picks.sort(key=lambda item: (item.get("game", {}) or {}).get("date") or item.get("updatedAt") or "")

    return {
        "user": serialize_user_profile(user_row),
        "picks": picks,
        "summary": summarize_pick_results(picks),
    }


def save_user_pick(
    *,
    user_id: str,
    pick_side: str,
    game_identifier: str | None = None,
    external_id: str | None = None,
) -> dict[str, Any]:
    config = load_config()
    normalized_user_id = validate_user_id(user_id)
    get_user_profile(normalized_user_id)

    canonical_pick = normalize_pick_side(pick_side)
    game_row = resolve_game_row(game_identifier=game_identifier, external_id=external_id)

    if is_game_locked(game_row):
        raise PredictionLockedError("This game is locked and can no longer be picked.")

    stored_pick = upsert_pick(
        {
            "user_id": normalized_user_id,
            "game_key": game_key_for_row(game_row),
            "season_year": game_row.get("season_year"),
            "week": game_row.get("week"),
            "game_external_id": game_row.get("external_id"),
            "pick_side": canonical_pick,
            "picked_team": picked_team_snapshot(game_row, canonical_pick),
            "source": "flask-api",
            "updated_at": utc_now_iso(),
        },
        config=config,
    )

    return serialize_pick_response(stored_pick, game_row)


def clear_user_pick(
    *,
    user_id: str,
    game_identifier: str | None = None,
    external_id: str | None = None,
) -> dict[str, Any]:
    config = load_config()
    normalized_user_id = validate_user_id(user_id)
    get_user_profile(normalized_user_id)
    game_row = resolve_game_row(game_identifier=game_identifier, external_id=external_id)

    if is_game_locked(game_row):
        raise PredictionLockedError("This game is locked and can no longer be changed.")

    delete_pick(
        user_id=normalized_user_id,
        game_key=game_key_for_row(game_row),
        config=config,
    )

    return {
        "userId": normalized_user_id,
        "gameId": game_key_for_row(game_row),
        "gameKey": game_key_for_row(game_row),
        "externalId": game_row.get("external_id"),
        "deleted": True,
    }


def leaderboard_entry_sort_key(entry: dict[str, Any]) -> tuple[Any, ...]:
    return (
        -entry["points"],
        entry["incorrect"],
        -entry["correct"],
        -entry["total"],
        entry["user"]["displayName"].lower(),
    )


def build_leaderboard(
    *,
    season_year: int | None,
    week: int | None,
    limit: int = 25,
) -> dict[str, Any]:
    config = load_config()
    pick_rows = fetch_picks(
        season_year=season_year,
        week=week,
        user_id=None,
        limit=None,
        config=config,
    )
    games_by_key = build_games_index(season_year=season_year, week=week)

    if not pick_rows:
        return {"entries": []}

    user_ids = sorted({to_text(row.get("user_id"), "") or "" for row in pick_rows if row.get("user_id")})
    users_by_id = {
        user_row.get("id"): serialize_user_profile(user_row)
        for user_row in fetch_users(user_ids=user_ids, limit=None, config=config)
    }

    aggregated: dict[str, dict[str, Any]] = {}
    for pick_row in pick_rows:
        user_id = pick_row.get("user_id")
        if not user_id:
            continue

        user_payload = users_by_id.get(user_id)
        if not user_payload:
            continue

        result = pick_result_status(
            normalize_pick_side(pick_row.get("pick_side")),
            games_by_key.get(pick_row.get("game_key")),
        )

        entry = aggregated.setdefault(
            user_id,
            {
                "user": user_payload,
                "points": 0,
                "correct": 0,
                "incorrect": 0,
                "pending": 0,
                "pushes": 0,
                "live": 0,
                "total": 0,
                "lastPickedAt": pick_row.get("updated_at"),
            },
        )

        entry["total"] += 1
        entry["lastPickedAt"] = max(
            entry["lastPickedAt"] or "",
            pick_row.get("updated_at") or "",
        )

        if result == "correct":
            entry["correct"] += 1
            entry["points"] += 1
        elif result == "incorrect":
            entry["incorrect"] += 1
        elif result == "push":
            entry["pushes"] += 1
        elif result == "live":
            entry["live"] += 1
        else:
            entry["pending"] += 1

    entries = list(aggregated.values())
    for entry in entries:
        settled = entry["correct"] + entry["incorrect"]
        entry["settled"] = settled
        entry["winPct"] = round(entry["correct"] / settled, 3) if settled else None

    entries.sort(key=leaderboard_entry_sort_key)

    ranked_entries: list[dict[str, Any]] = []
    for index, entry in enumerate(entries[:limit], start=1):
        ranked_entries.append(
            {
                "rank": index,
                "user": entry["user"],
                "points": entry["points"],
                "correct": entry["correct"],
                "incorrect": entry["incorrect"],
                "pending": entry["pending"],
                "pushes": entry["pushes"],
                "live": entry["live"],
                "settled": entry["settled"],
                "total": entry["total"],
                "winPct": entry["winPct"],
                "lastPickedAt": entry["lastPickedAt"],
            }
        )

    return {"entries": ranked_entries}

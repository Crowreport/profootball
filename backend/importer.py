from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

from .config import load_config
from .database import delete_games, fetch_games, upsert_games

ESPN_SITE_SOURCE = "espn-site-api"
ESPN_CORE_SOURCE = "espn-core-api"
REGULAR_SEASON_TYPE = 2
NFL_TEAM_ABBREVIATIONS = {
    "Arizona Cardinals": "ARI",
    "Atlanta Falcons": "ATL",
    "Baltimore Ravens": "BAL",
    "Buffalo Bills": "BUF",
    "Carolina Panthers": "CAR",
    "Chicago Bears": "CHI",
    "Cincinnati Bengals": "CIN",
    "Cleveland Browns": "CLE",
    "Dallas Cowboys": "DAL",
    "Denver Broncos": "DEN",
    "Detroit Lions": "DET",
    "Green Bay Packers": "GB",
    "Houston Texans": "HOU",
    "Indianapolis Colts": "IND",
    "Jacksonville Jaguars": "JAX",
    "Kansas City Chiefs": "KC",
    "Las Vegas Raiders": "LV",
    "Los Angeles Chargers": "LAC",
    "Los Angeles Rams": "LAR",
    "Miami Dolphins": "MIA",
    "Minnesota Vikings": "MIN",
    "New England Patriots": "NE",
    "New Orleans Saints": "NO",
    "New York Giants": "NYG",
    "New York Jets": "NYJ",
    "Philadelphia Eagles": "PHI",
    "Pittsburgh Steelers": "PIT",
    "San Francisco 49ers": "SF",
    "Seattle Seahawks": "SEA",
    "Tampa Bay Buccaneers": "TB",
    "Tennessee Titans": "TEN",
    "Washington Commanders": "WSH",
}


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def to_text(value: Any, fallback: str | None = None) -> str | None:
    if value is None:
        return fallback

    if isinstance(value, (str, int, float)):
        return str(value)

    if isinstance(value, dict):
        for key in ("fullName", "displayName", "shortDisplayName", "shortName", "name", "description", "summary"):
            candidate = value.get(key)
            if isinstance(candidate, (str, int, float)):
                return str(candidate)

    return fallback


def to_int(value: Any) -> int | None:
    if value is None or value == "":
        return None

    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def derive_short_name(name: str) -> str:
    parts = name.split()
    return parts[-1] if parts else "Unknown"


def derive_abbreviation(name: str, external_id: str, provided: str | None = None) -> str:
    if provided:
        return provided.upper()

    known_abbreviation = NFL_TEAM_ABBREVIATIONS.get(name)
    if known_abbreviation:
        return known_abbreviation

    letters = "".join(part[0] for part in name.split() if part and part[0].isalnum())
    if letters:
        return letters[:4].upper()

    return external_id.upper()[:4] or "UNK"


def normalize_ref_url(ref: str | None) -> str | None:
    if not ref:
        return None
    if ref.startswith("https://"):
        return ref
    if ref.startswith("http://"):
        return ref.replace("http://", "https://", 1)
    return f"https://{ref}"


def extract_week_number(raw_week: Any) -> int | None:
    if raw_week is None:
        return None

    if isinstance(raw_week, dict):
        for key in ("number", "value"):
            if raw_week.get(key) is not None:
                return to_int(raw_week.get(key))

    match = re.search(r"\d+", str(raw_week))
    if not match:
        return None

    return int(match.group())


def normalize_espn_status(status: dict[str, Any]) -> str:
    status_type = status.get("type") if isinstance(status, dict) else {}
    status_type = status_type if isinstance(status_type, dict) else {}

    description = (
        to_text(status_type.get("description"))
        or to_text(status.get("description") if isinstance(status, dict) else None)
        or ""
    ).lower()
    state = (to_text(status_type.get("state")) or "").lower()
    detail = (to_text(status_type.get("shortDetail")) or "").lower()
    completed = bool(status_type.get("completed"))

    if "postpon" in description:
        return "postponed"
    if "cancel" in description:
        return "cancelled"
    if completed or state == "post":
        return "final"
    if state == "in" or any(token in detail for token in ("quarter", "halftime", "ot")):
        return "live"
    if state == "pre":
        return "scheduled"

    return description or state or "scheduled"


def extract_logo_url(team_data: dict[str, Any]) -> str | None:
    direct_logo = to_text(team_data.get("logo"))
    if direct_logo:
        return direct_logo

    logos = team_data.get("logos") or []
    if logos and isinstance(logos[0], dict):
        return to_text(logos[0].get("href"))

    return None


def normalize_espn_team(competitor: dict[str, Any]) -> dict[str, Any]:
    team_data = competitor.get("team") or {}
    name = (
        to_text(team_data.get("displayName"))
        or to_text(team_data.get("name"))
        or "Unknown Team"
    )
    external_id = to_text(team_data.get("id"), "unknown") or "unknown"
    short_name = (
        to_text(team_data.get("shortDisplayName"))
        or derive_short_name(name)
    )

    records = competitor.get("records") or []
    first_record = records[0] if records and isinstance(records[0], dict) else {}

    return {
        "external_id": external_id,
        "name": name,
        "display_name": name,
        "short_name": short_name,
        "abbreviation": derive_abbreviation(
            name,
            external_id,
            to_text(team_data.get("abbreviation")),
        ),
        "logo_url": extract_logo_url(team_data),
        "record": to_text(first_record.get("summary")),
        "score": to_int(competitor.get("score")),
    }


def extract_broadcast(competition: dict[str, Any]) -> str | None:
    broadcasts = competition.get("broadcasts") or []
    for item in broadcasts:
        if not isinstance(item, dict):
            continue
        media = item.get("media") or {}
        label = to_text(media.get("shortName")) or to_text(media.get("longName"))
        if label:
            return label
    return None


def extract_odds_value(competition: dict[str, Any], key: str) -> Any:
    odds = competition.get("odds") or []
    if not odds or not isinstance(odds[0], dict):
        return None
    return odds[0].get(key)


def normalize_espn_game(
    event: dict[str, Any],
    *,
    requested_season: int,
    requested_week: int,
    fetched_at: str,
    source: str,
) -> dict[str, Any] | None:
    competitions = event.get("competitions") or []
    competition = competitions[0] if competitions and isinstance(competitions[0], dict) else {}
    competitors = competition.get("competitors") or []

    home_competitor = next(
        (item for item in competitors if isinstance(item, dict) and item.get("homeAway") == "home"),
        None,
    )
    away_competitor = next(
        (item for item in competitors if isinstance(item, dict) and item.get("homeAway") == "away"),
        None,
    )

    kickoff_time = to_text(event.get("date"))
    external_id = to_text(event.get("id"))

    if not home_competitor or not away_competitor or not kickoff_time or not external_id:
        return None

    season = to_int((event.get("season") or {}).get("year")) or requested_season
    week = extract_week_number(event.get("week")) or requested_week
    venue = to_text(competition.get("venue"), "TBD")

    return {
        "external_id": external_id,
        "season_year": season,
        "week": week,
        "kickoff_time": kickoff_time,
        "status": normalize_espn_status(competition.get("status") or event.get("status") or {}),
        "venue": venue,
        "broadcast": extract_broadcast(competition),
        "source": source,
        "source_updated_at": fetched_at,
        "spread": to_text(extract_odds_value(competition, "details")),
        "over_under": extract_odds_value(competition, "overUnder"),
        "home_team": normalize_espn_team(home_competitor),
        "away_team": normalize_espn_team(away_competitor),
    }


def fetch_games_from_espn_site_api(
    *,
    base_url: str,
    season_year: int,
    week: int,
    timeout_seconds: int,
) -> list[dict[str, Any]]:
    response = requests.get(
        f"{base_url}/scoreboard",
        params={
            "seasontype": REGULAR_SEASON_TYPE,
            "week": week,
            "year": season_year,
        },
        timeout=timeout_seconds,
        headers={"Accept": "application/json"},
    )
    response.raise_for_status()

    payload = response.json()
    fetched_at = utc_now_iso()
    games: list[dict[str, Any]] = []

    for event in payload.get("events") or []:
        normalized = normalize_espn_game(
            event,
            requested_season=season_year,
            requested_week=week,
            fetched_at=fetched_at,
            source=ESPN_SITE_SOURCE,
        )
        if normalized and normalized["week"] == week:
            games.append(normalized)

    return games


def fetch_games_from_espn_core_api(
    *,
    base_url: str,
    season_year: int,
    week: int,
    timeout_seconds: int,
) -> list[dict[str, Any]]:
    response = requests.get(
        f"{base_url}/seasons/{season_year}/types/{REGULAR_SEASON_TYPE}/events",
        params={"week": week, "limit": 64},
        timeout=timeout_seconds,
        headers={"Accept": "application/json"},
    )
    response.raise_for_status()

    payload = response.json()
    items = payload.get("items") or []
    fetched_at = utc_now_iso()
    games: list[dict[str, Any]] = []

    for item in items:
        if not isinstance(item, dict):
            continue

        detail_url = normalize_ref_url(to_text(item.get("$ref")))
        if not detail_url:
            continue

        event_response = requests.get(
            detail_url,
            timeout=timeout_seconds,
            headers={"Accept": "application/json"},
        )
        event_response.raise_for_status()

        normalized = normalize_espn_game(
            event_response.json(),
            requested_season=season_year,
            requested_week=week,
            fetched_at=fetched_at,
            source=ESPN_CORE_SOURCE,
        )
        if normalized and normalized["week"] == week:
            games.append(normalized)

    return games


def load_seed_games(seed_path: Path, season_year: int, week: int) -> list[dict[str, Any]]:
    if not seed_path.exists():
        return []

    with seed_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    games: list[dict[str, Any]] = []
    for item in payload:
        if item.get("season_year") != season_year or item.get("week") != week:
            continue

        game = dict(item)
        game.setdefault("source", "seed")
        game.setdefault("source_updated_at", utc_now_iso())
        games.append(game)

    return games


def team_identity(team: dict[str, Any]) -> str:
    return (
        to_text(team.get("abbreviation"))
        or to_text(team.get("external_id"))
        or to_text(team.get("display_name"))
        or to_text(team.get("name"))
        or "unknown"
    ).upper()


def matchup_key(game: dict[str, Any]) -> str:
    return "|".join(
        [
            str(game.get("season_year") or game.get("season") or ""),
            str(game.get("week") or ""),
            to_text(game.get("kickoff_time") or game.get("date"), "") or "",
            team_identity(game.get("home_team") or game.get("homeTeam") or {}),
            team_identity(game.get("away_team") or game.get("awayTeam") or {}),
        ]
    )


def should_replace_game(existing: dict[str, Any], candidate: dict[str, Any]) -> bool:
    existing_is_seed = existing.get("source") == "seed"
    candidate_is_seed = candidate.get("source") == "seed"
    if existing_is_seed != candidate_is_seed:
        return existing_is_seed and not candidate_is_seed

    existing_updated_at = to_text(existing.get("source_updated_at"), "") or ""
    candidate_updated_at = to_text(candidate.get("source_updated_at"), "") or ""
    return candidate_updated_at > existing_updated_at


def dedupe_game_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    deduped: dict[str, dict[str, Any]] = {}

    for row in rows:
        key = matchup_key(row)
        existing = deduped.get(key)
        if existing is None or should_replace_game(existing, row):
            deduped[key] = row

    return list(deduped.values())


def sync_games(*, season_year: int | None = None, week: int | None = None, seed_only: bool = False) -> dict[str, Any]:
    config = load_config()
    target_season = season_year or config.default_season_year
    target_week = week or config.default_week

    errors: list[str] = []
    source = "seed"
    games: list[dict[str, Any]] = []

    if not seed_only:
        try:
            games = fetch_games_from_espn_site_api(
                base_url=config.espn_site_api_base_url,
                season_year=target_season,
                week=target_week,
                timeout_seconds=config.request_timeout_seconds,
            )
            if games:
                source = ESPN_SITE_SOURCE
        except requests.RequestException as exc:
            errors.append(f"ESPN site API fetch failed: {exc}")

        if not games:
            try:
                games = fetch_games_from_espn_core_api(
                    base_url=config.espn_core_api_base_url,
                    season_year=target_season,
                    week=target_week,
                    timeout_seconds=config.request_timeout_seconds,
                )
                if games:
                    source = ESPN_CORE_SOURCE
            except requests.RequestException as exc:
                errors.append(f"ESPN core API fetch failed: {exc}")

    if not games and (config.allow_seed_fallback or seed_only):
        games = load_seed_games(config.seed_file, target_season, target_week)
        if games:
            source = "seed"

    if not games:
        return {
            "imported": 0,
            "season_year": target_season,
            "week": target_week,
            "source": source,
            "errors": errors,
        }

    try:
        if source != "seed":
            delete_games(
                season_year=target_season,
                week=target_week,
                source="seed",
                config=config,
            )
        upsert_games(games, config=config)
    except (requests.RequestException, RuntimeError, ValueError) as exc:
        errors.append(f"Supabase sync failed: {exc}")
        return {
            "imported": 0,
            "season_year": target_season,
            "week": target_week,
            "source": source,
            "errors": errors,
        }

    return {
        "imported": len(games),
        "season_year": target_season,
        "week": target_week,
        "source": source,
        "errors": errors,
    }


def list_games(
    *,
    season_year: int | None = None,
    week: int | None = None,
    limit: int = 8,
    status: str | None = None,
) -> list[dict[str, Any]]:
    config = load_config()
    rows = dedupe_game_rows(
        fetch_games(
            season_year=season_year,
            week=week,
            limit=limit,
            status=status,
            config=config,
        )
    )

    games: list[dict[str, Any]] = []
    for row in rows:
        home_team = row.get("home_team") or {}
        away_team = row.get("away_team") or {}

        games.append(
            {
                "id": row.get("external_id"),
                "season": row.get("season_year"),
                "week": row.get("week"),
                "date": row.get("kickoff_time"),
                "status": row.get("status"),
                "venue": row.get("venue"),
                "broadcast": row.get("broadcast"),
                "source": row.get("source"),
                "updatedAt": row.get("source_updated_at"),
                "spread": row.get("spread"),
                "overUnder": row.get("over_under"),
                "homeTeam": {
                    "id": home_team.get("external_id"),
                    "name": home_team.get("display_name") or home_team.get("name"),
                    "shortName": home_team.get("short_name"),
                    "abbreviation": home_team.get("abbreviation"),
                    "logo": home_team.get("logo_url"),
                    "record": home_team.get("record") or "0-0",
                    "score": home_team.get("score"),
                },
                "awayTeam": {
                    "id": away_team.get("external_id"),
                    "name": away_team.get("display_name") or away_team.get("name"),
                    "shortName": away_team.get("short_name"),
                    "abbreviation": away_team.get("abbreviation"),
                    "logo": away_team.get("logo_url"),
                    "record": away_team.get("record") or "0-0",
                    "score": away_team.get("score"),
                },
            }
        )

    return games

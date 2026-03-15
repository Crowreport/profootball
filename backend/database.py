from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import requests

from .config import Config, load_config

SCHEMA_SQL = """
create table if not exists prediction_games (
    external_id text primary key,
    season_year integer not null,
    week integer not null,
    kickoff_time timestamptz not null,
    status text not null,
    venue text,
    broadcast text,
    source text not null,
    source_updated_at timestamptz not null,
    spread text,
    over_under numeric,
    home_team jsonb not null,
    away_team jsonb not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_prediction_games_season_week_kickoff
on prediction_games (season_year, week, kickoff_time);

create index if not exists idx_prediction_games_status
on prediction_games (status);
"""


def get_schema_path(config: Config | None = None) -> Path:
    active_config = config or load_config()
    return active_config.backend_root / "supabase_schema.sql"


def ensure_schema_file(config: Config | None = None) -> Path:
    schema_path = get_schema_path(config)
    schema_path.write_text(SCHEMA_SQL.strip() + "\n", encoding="utf-8")
    return schema_path


def ensure_supabase_config(config: Config | None = None) -> Config:
    active_config = config or load_config()
    if not active_config.supabase_url:
        raise RuntimeError("Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL).")
    if not active_config.supabase_api_key:
        raise RuntimeError(
            "Missing SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SECRET_KEY, or SUPABASE_API_KEY."
        )
    return active_config


def build_table_url(config: Config, table_name: str | None = None) -> str:
    table = table_name or config.supabase_games_table
    return f"{config.supabase_url.rstrip('/')}/rest/v1/{table}"


def supabase_headers(config: Config, *, prefer: str | None = None) -> dict[str, str]:
    headers = {
        "apikey": config.supabase_api_key,
        "Authorization": f"Bearer {config.supabase_api_key}",
        "Content-Type": "application/json",
    }

    if prefer:
        headers["Prefer"] = prefer

    return headers


def serialize_game_for_supabase(game: dict[str, Any]) -> dict[str, Any]:
    return {
        "external_id": game["external_id"],
        "season_year": game["season_year"],
        "week": game["week"],
        "kickoff_time": game["kickoff_time"],
        "status": game["status"],
        "venue": game.get("venue"),
        "broadcast": game.get("broadcast"),
        "source": game["source"],
        "source_updated_at": game["source_updated_at"],
        "spread": game.get("spread"),
        "over_under": game.get("over_under"),
        "home_team": game["home_team"],
        "away_team": game["away_team"],
        "updated_at": game["source_updated_at"],
    }


def delete_games(
    *,
    season_year: int | None = None,
    week: int | None = None,
    status: str | None = None,
    source: str | None = None,
    config: Config | None = None,
) -> None:
    active_config = ensure_supabase_config(config)

    params: list[tuple[str, str]] = []
    if season_year is not None:
        params.append(("season_year", f"eq.{season_year}"))
    if week is not None:
        params.append(("week", f"eq.{week}"))
    if status:
        params.append(("status", f"eq.{status}"))
    if source:
        params.append(("source", f"eq.{source}"))

    if not params:
        raise ValueError("Refusing to delete games without at least one filter.")

    response = requests.delete(
        build_table_url(active_config),
        params=params,
        headers=supabase_headers(active_config, prefer="return=minimal"),
        timeout=active_config.request_timeout_seconds,
    )
    response.raise_for_status()


def upsert_games(games: list[dict[str, Any]], *, config: Config | None = None) -> int:
    if not games:
        return 0

    active_config = ensure_supabase_config(config)
    response = requests.post(
        build_table_url(active_config),
        params={"on_conflict": "external_id"},
        headers=supabase_headers(
            active_config,
            prefer="resolution=merge-duplicates,return=minimal",
        ),
        json=[serialize_game_for_supabase(game) for game in games],
        timeout=active_config.request_timeout_seconds,
    )
    response.raise_for_status()
    return len(games)


def parse_team_blob(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    if isinstance(value, str) and value:
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return {}
        return parsed if isinstance(parsed, dict) else {}
    return {}


def fetch_games(
    *,
    season_year: int | None = None,
    week: int | None = None,
    limit: int = 8,
    status: str | None = None,
    config: Config | None = None,
) -> list[dict[str, Any]]:
    active_config = ensure_supabase_config(config)

    params: list[tuple[str, str]] = [
        (
            "select",
            "external_id,season_year,week,kickoff_time,status,venue,broadcast,source,source_updated_at,spread,over_under,home_team,away_team",
        ),
        ("order", "kickoff_time.asc"),
        ("limit", str(limit)),
    ]

    if season_year is not None:
        params.append(("season_year", f"eq.{season_year}"))
    if week is not None:
        params.append(("week", f"eq.{week}"))
    if status:
        params.append(("status", f"eq.{status}"))

    response = requests.get(
        build_table_url(active_config),
        params=params,
        headers=supabase_headers(active_config),
        timeout=active_config.request_timeout_seconds,
    )
    response.raise_for_status()

    rows = response.json()
    if not isinstance(rows, list):
        raise RuntimeError("Supabase returned a non-list response for games.")

    normalized_rows: list[dict[str, Any]] = []
    for row in rows:
        normalized_rows.append(
            {
                "external_id": row.get("external_id"),
                "season_year": row.get("season_year"),
                "week": row.get("week"),
                "kickoff_time": row.get("kickoff_time"),
                "status": row.get("status"),
                "venue": row.get("venue"),
                "broadcast": row.get("broadcast"),
                "source": row.get("source"),
                "source_updated_at": row.get("source_updated_at"),
                "spread": row.get("spread"),
                "over_under": row.get("over_under"),
                "home_team": parse_team_blob(row.get("home_team")),
                "away_team": parse_team_blob(row.get("away_team")),
            }
        )

    return normalized_rows

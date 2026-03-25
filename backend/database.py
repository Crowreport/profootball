from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import requests

from .config import Config, load_config

SCHEMA_SQL = """
create table if not exists prediction_games (
    external_id text primary key,
    game_key text,
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

alter table prediction_games
add column if not exists game_key text;

update prediction_games
set game_key = concat_ws(
    '|',
    season_year::text,
    week::text,
    to_char(kickoff_time at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI"Z"'),
    upper(coalesce(home_team->>'abbreviation', home_team->>'external_id', home_team->>'display_name', home_team->>'name', 'UNKNOWN')),
    upper(coalesce(away_team->>'abbreviation', away_team->>'external_id', away_team->>'display_name', away_team->>'name', 'UNKNOWN'))
)
where game_key is distinct from concat_ws(
    '|',
    season_year::text,
    week::text,
    to_char(kickoff_time at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI"Z"'),
    upper(coalesce(home_team->>'abbreviation', home_team->>'external_id', home_team->>'display_name', home_team->>'name', 'UNKNOWN')),
    upper(coalesce(away_team->>'abbreviation', away_team->>'external_id', away_team->>'display_name', away_team->>'name', 'UNKNOWN'))
);

delete from prediction_games
where external_id in (
    select external_id
    from (
        select
            external_id,
            row_number() over (
                partition by game_key
                order by
                    case when source = 'seed' then 1 else 0 end asc,
                    source_updated_at desc,
                    updated_at desc,
                    external_id desc
            ) as row_rank
        from prediction_games
        where game_key is not null
    ) ranked_games
    where row_rank > 1
);

alter table prediction_games
alter column game_key set not null;

create unique index if not exists idx_prediction_games_game_key
on prediction_games (game_key);

create index if not exists idx_prediction_games_season_week_kickoff
on prediction_games (season_year, week, kickoff_time);

create index if not exists idx_prediction_games_status
on prediction_games (status);

create table if not exists prediction_picks (
    user_id uuid not null references public.users(id) on delete cascade,
    game_key text not null references prediction_games(game_key) on update cascade on delete cascade,
    season_year integer not null,
    week integer not null,
    game_external_id text,
    pick_side text not null check (pick_side in ('home', 'away')),
    picked_team jsonb not null,
    source text not null default 'flask-api',
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    primary key (user_id, game_key)
);

alter table if exists prediction_picks
drop constraint if exists prediction_picks_game_key_fkey;

alter table if exists prediction_picks
add constraint prediction_picks_game_key_fkey
foreign key (game_key)
references prediction_games(game_key)
on update cascade
on delete cascade;

alter table if exists prediction_picks enable row level security;

grant select, insert, update, delete on table prediction_picks to authenticated;

drop policy if exists prediction_picks_select_own on prediction_picks;
create policy prediction_picks_select_own
on prediction_picks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists prediction_picks_insert_own on prediction_picks;
create policy prediction_picks_insert_own
on prediction_picks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists prediction_picks_update_own on prediction_picks;
create policy prediction_picks_update_own
on prediction_picks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists prediction_picks_delete_own on prediction_picks;
create policy prediction_picks_delete_own
on prediction_picks
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists idx_prediction_picks_season_week
on prediction_picks (season_year, week, updated_at desc);

create index if not exists idx_prediction_picks_user
on prediction_picks (user_id, updated_at desc);
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
        "game_key": game["game_key"],
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


def serialize_pick_for_supabase(pick: dict[str, Any]) -> dict[str, Any]:
    return {
        "user_id": pick["user_id"],
        "game_key": pick["game_key"],
        "season_year": pick["season_year"],
        "week": pick["week"],
        "game_external_id": pick.get("game_external_id"),
        "pick_side": pick["pick_side"],
        "picked_team": pick["picked_team"],
        "source": pick.get("source", "flask-api"),
        "updated_at": pick["updated_at"],
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
        params={"on_conflict": "game_key"},
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


def parse_pick_blob(value: Any) -> dict[str, Any]:
    return parse_team_blob(value)


def normalize_game_row(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "external_id": row.get("external_id"),
        "game_key": row.get("game_key"),
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


def normalize_pick_row(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "user_id": row.get("user_id"),
        "game_key": row.get("game_key"),
        "season_year": row.get("season_year"),
        "week": row.get("week"),
        "game_external_id": row.get("game_external_id"),
        "pick_side": row.get("pick_side"),
        "picked_team": parse_pick_blob(row.get("picked_team")),
        "source": row.get("source"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def normalize_user_row(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id"),
        "username": row.get("username"),
        "first_name": row.get("first_name"),
        "last_name": row.get("last_name"),
        "role": row.get("role"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def parse_list_response(response: requests.Response, context: str) -> list[dict[str, Any]]:
    rows = response.json()
    if not isinstance(rows, list):
        raise RuntimeError(f"Supabase returned a non-list response for {context}.")
    return rows


def build_in_filter(values: list[str]) -> str:
    escaped_values = []
    for value in values:
        normalized = str(value).replace("\\", "\\\\").replace('"', '\\"')
        escaped_values.append(f'"{normalized}"')
    return f"in.({','.join(escaped_values)})"


def fetch_games(
    *,
    season_year: int | None = None,
    week: int | None = None,
    limit: int | None = 8,
    status: str | None = None,
    config: Config | None = None,
) -> list[dict[str, Any]]:
    active_config = ensure_supabase_config(config)

    params: list[tuple[str, str]] = [
        (
            "select",
            "external_id,game_key,season_year,week,kickoff_time,status,venue,broadcast,source,source_updated_at,spread,over_under,home_team,away_team",
        ),
        ("order", "kickoff_time.asc"),
    ]

    if limit is not None:
        params.append(("limit", str(limit)))

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
    return [normalize_game_row(row) for row in parse_list_response(response, "games")]


def fetch_game(
    *,
    game_key: str | None = None,
    external_id: str | None = None,
    config: Config | None = None,
) -> dict[str, Any] | None:
    if not game_key and not external_id:
        raise ValueError("fetch_game requires either game_key or external_id.")

    active_config = ensure_supabase_config(config)
    params: list[tuple[str, str]] = [
        (
            "select",
            "external_id,game_key,season_year,week,kickoff_time,status,venue,broadcast,source,source_updated_at,spread,over_under,home_team,away_team",
        ),
        ("limit", "1"),
    ]

    if game_key:
        params.append(("game_key", f"eq.{game_key}"))
    else:
        params.append(("external_id", f"eq.{external_id}"))

    response = requests.get(
        build_table_url(active_config),
        params=params,
        headers=supabase_headers(active_config),
        timeout=active_config.request_timeout_seconds,
    )
    response.raise_for_status()

    rows = parse_list_response(response, "game lookup")
    if not rows:
        return None

    return normalize_game_row(rows[0])


def upsert_pick(pick: dict[str, Any], *, config: Config | None = None) -> dict[str, Any]:
    active_config = ensure_supabase_config(config)
    response = requests.post(
        build_table_url(active_config, active_config.supabase_picks_table),
        params={"on_conflict": "user_id,game_key"},
        headers=supabase_headers(
            active_config,
            prefer="resolution=merge-duplicates,return=representation",
        ),
        json=[serialize_pick_for_supabase(pick)],
        timeout=active_config.request_timeout_seconds,
    )
    response.raise_for_status()

    rows = parse_list_response(response, "pick upsert")
    if not rows:
        raise RuntimeError("Supabase returned an empty response for pick upsert.")

    return normalize_pick_row(rows[0])


def delete_pick(
    *,
    user_id: str,
    game_key: str,
    config: Config | None = None,
) -> None:
    active_config = ensure_supabase_config(config)
    response = requests.delete(
        build_table_url(active_config, active_config.supabase_picks_table),
        params=[
            ("user_id", f"eq.{user_id}"),
            ("game_key", f"eq.{game_key}"),
        ],
        headers=supabase_headers(active_config, prefer="return=minimal"),
        timeout=active_config.request_timeout_seconds,
    )
    response.raise_for_status()


def fetch_picks(
    *,
    season_year: int | None = None,
    week: int | None = None,
    user_id: str | None = None,
    limit: int | None = 512,
    config: Config | None = None,
) -> list[dict[str, Any]]:
    active_config = ensure_supabase_config(config)
    params: list[tuple[str, str]] = [
        (
            "select",
            "user_id,game_key,season_year,week,game_external_id,pick_side,picked_team,source,created_at,updated_at",
        ),
        ("order", "updated_at.desc"),
    ]

    if limit is not None:
        params.append(("limit", str(limit)))

    if season_year is not None:
        params.append(("season_year", f"eq.{season_year}"))
    if week is not None:
        params.append(("week", f"eq.{week}"))
    if user_id:
        params.append(("user_id", f"eq.{user_id}"))

    response = requests.get(
        build_table_url(active_config, active_config.supabase_picks_table),
        params=params,
        headers=supabase_headers(active_config),
        timeout=active_config.request_timeout_seconds,
    )
    response.raise_for_status()

    return [normalize_pick_row(row) for row in parse_list_response(response, "picks")]


def fetch_users(
    *,
    user_ids: list[str] | None = None,
    limit: int | None = 100,
    config: Config | None = None,
) -> list[dict[str, Any]]:
    active_config = ensure_supabase_config(config)
    params: list[tuple[str, str]] = [
        ("select", "id,username,first_name,last_name,role,created_at,updated_at"),
        ("order", "username.asc"),
    ]

    if limit is not None:
        params.append(("limit", str(limit)))

    if user_ids:
        if len(user_ids) == 1:
            params.append(("id", f"eq.{user_ids[0]}"))
        else:
            params.append(("id", build_in_filter(user_ids)))

    response = requests.get(
        build_table_url(active_config, active_config.supabase_users_table),
        params=params,
        headers=supabase_headers(active_config),
        timeout=active_config.request_timeout_seconds,
    )
    response.raise_for_status()

    return [normalize_user_row(row) for row in parse_list_response(response, "users")]

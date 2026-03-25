from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


def current_nfl_season_year(now: datetime | None = None) -> int:
    current = now or datetime.now(timezone.utc)
    return current.year if current.month >= 9 else current.year - 1


def _read_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Config:
    project_root: Path
    backend_root: Path
    seed_file: Path
    frontend_origins: tuple[str, ...]
    request_timeout_seconds: int
    default_season_year: int
    default_week: int
    allow_seed_fallback: bool
    espn_site_api_base_url: str
    espn_core_api_base_url: str
    supabase_url: str | None
    supabase_api_key: str | None
    supabase_games_table: str
    supabase_picks_table: str
    supabase_users_table: str


def load_config() -> Config:
    backend_root = Path(__file__).resolve().parent
    project_root = backend_root.parent

    seed_value = os.getenv("GAMES_SEED_FILE", str(backend_root / "data" / "seed_games.json"))
    seed_file = Path(seed_value)
    if not seed_file.is_absolute():
        seed_file = project_root / seed_file

    frontend_origins = tuple(
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGIN",
            "http://localhost:3000,http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    )

    return Config(
        project_root=project_root,
        backend_root=backend_root,
        seed_file=seed_file,
        frontend_origins=frontend_origins,
        request_timeout_seconds=int(os.getenv("GAMES_REQUEST_TIMEOUT_SECONDS", "15")),
        default_season_year=int(os.getenv("NFL_SEASON_YEAR", str(current_nfl_season_year()))),
        default_week=int(os.getenv("NFL_WEEK", "1")),
        allow_seed_fallback=_read_bool("GAMES_ALLOW_SEED_FALLBACK", True),
        espn_site_api_base_url=os.getenv(
            "ESPN_SITE_API_BASE_URL",
            "https://site.api.espn.com/apis/site/v2/sports/football/nfl",
        ).rstrip("/"),
        espn_core_api_base_url=os.getenv(
            "ESPN_CORE_API_BASE_URL",
            "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl",
        ).rstrip("/"),
        supabase_url=(
            os.getenv("SUPABASE_URL")
            or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        ),
        supabase_api_key=(
            os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            or os.getenv("SUPABASE_SECRET_KEY")
            or os.getenv("SUPABASE_API_KEY")
        ),
        supabase_games_table=os.getenv("SUPABASE_GAMES_TABLE", "prediction_games"),
        supabase_picks_table=os.getenv("SUPABASE_PICKS_TABLE", "prediction_picks"),
        supabase_users_table=os.getenv("SUPABASE_USERS_TABLE", "users"),
    )

from __future__ import annotations

from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

from .config import load_config
from .importer import list_games


def parse_int_arg(name: str, default: int, minimum: int, maximum: int) -> tuple[int | None, tuple[dict, int] | None]:
    raw_value = request.args.get(name)
    if raw_value is None or raw_value == "":
        return default, None

    try:
        value = int(raw_value)
    except ValueError:
        return None, ({"error": f"Query parameter '{name}' must be an integer."}, 400)

    if value < minimum or value > maximum:
        return None, ({"error": f"Query parameter '{name}' must be between {minimum} and {maximum}."}, 400)

    return value, None


def create_app() -> Flask:
    config = load_config()

    app = Flask(__name__)
    app.config["JSON_SORT_KEYS"] = False
    CORS(app, resources={r"/api/*": {"origins": list(config.frontend_origins)}})

    @app.get("/healthz")
    def healthz():
        return jsonify(
            {
                "status": "ok",
                "storage": "supabase",
                "supabaseConfigured": bool(config.supabase_url and config.supabase_api_key),
                "gamesTable": config.supabase_games_table,
                "defaultSeason": config.default_season_year,
                "defaultWeek": config.default_week,
            }
        )

    @app.get("/api/games")
    def get_games():
        season_year, season_error = parse_int_arg(
            "season",
            config.default_season_year,
            2000,
            2100,
        )
        if season_error:
            payload, status_code = season_error
            return jsonify(payload), status_code

        week, week_error = parse_int_arg("week", config.default_week, 1, 18)
        if week_error:
            payload, status_code = week_error
            return jsonify(payload), status_code

        limit, limit_error = parse_int_arg("limit", 8, 1, 32)
        if limit_error:
            payload, status_code = limit_error
            return jsonify(payload), status_code

        status_filter = request.args.get("status")

        try:
            games = list_games(
                season_year=season_year,
                week=week,
                limit=limit,
                status=status_filter,
            )
        except (requests.RequestException, RuntimeError, ValueError) as exc:
            return jsonify({"error": "Failed to read games from Supabase.", "details": str(exc)}), 500

        response = {
            "games": games,
            "meta": {
                "count": len(games),
                "season": season_year,
                "week": week,
                "limit": limit,
                "status": status_filter,
            },
        }

        if not games:
            response["message"] = (
                "No games found. Run `python3 -m backend.scripts.sync_games --season "
                f"{season_year} --week {week}` to import data into Supabase."
            )

        return jsonify(response)

    return app


app = create_app()

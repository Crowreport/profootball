from __future__ import annotations

from http import HTTPStatus

from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

from .config import load_config
from .importer import list_games
from .predictions import (
    PredictionLockedError,
    PredictionNotFoundError,
    PredictionValidationError,
    build_leaderboard,
    clear_user_pick,
    list_user_picks,
    save_user_pick,
)


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


def parse_optional_int_arg(name: str, minimum: int, maximum: int) -> tuple[int | None, tuple[dict, int] | None]:
    raw_value = request.args.get(name)
    if raw_value is None or raw_value == "":
        return None, None

    try:
        value = int(raw_value)
    except ValueError:
        return None, ({"error": f"Query parameter '{name}' must be an integer."}, 400)

    if value < minimum or value > maximum:
        return None, ({"error": f"Query parameter '{name}' must be between {minimum} and {maximum}."}, 400)

    return value, None


def get_user_id_from_request_body(payload: dict) -> str | None:
    for key in ("userId", "user_id"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def get_game_id_from_request_body(payload: dict) -> str | None:
    for key in ("gameKey", "gameId", "game_id", "id"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def prediction_error_response(exc: Exception) -> tuple[dict, int]:
    if isinstance(exc, PredictionValidationError):
        return {"error": str(exc)}, HTTPStatus.BAD_REQUEST
    if isinstance(exc, PredictionNotFoundError):
        return {"error": str(exc)}, HTTPStatus.NOT_FOUND
    if isinstance(exc, PredictionLockedError):
        return {"error": str(exc)}, HTTPStatus.CONFLICT
    return {"error": "Prediction service request failed.", "details": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR


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
                "picksTable": config.supabase_picks_table,
                "usersTable": config.supabase_users_table,
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

    @app.get("/api/picks")
    def get_picks():
        user_id = request.args.get("userId") or request.args.get("user_id")
        if not user_id:
            return jsonify({"error": "Query parameter 'userId' is required."}), 400

        season_year, season_error = parse_int_arg(
            "season",
            config.default_season_year,
            2000,
            2100,
        )
        if season_error:
            payload, status_code = season_error
            return jsonify(payload), status_code

        week, week_error = parse_optional_int_arg("week", 1, 18)
        if week_error:
            payload, status_code = week_error
            return jsonify(payload), status_code

        limit, limit_error = parse_int_arg("limit", 64, 1, 512)
        if limit_error:
            payload, status_code = limit_error
            return jsonify(payload), status_code

        try:
            payload = list_user_picks(
                user_id=user_id,
                season_year=season_year,
                week=week,
                limit=limit,
            )
        except (requests.RequestException, RuntimeError, ValueError, PredictionValidationError, PredictionNotFoundError, PredictionLockedError) as exc:
            error_payload, status_code = prediction_error_response(exc)
            return jsonify(error_payload), status_code

        response = {
            "user": payload["user"],
            "picks": payload["picks"],
            "summary": payload["summary"],
            "meta": {
                "count": len(payload["picks"]),
                "season": season_year,
                "week": week,
                "limit": limit,
            },
        }

        if not payload["picks"]:
            response["message"] = "No picks found for this user and time window."

        return jsonify(response)

    @app.post("/api/picks")
    def create_or_update_pick():
        payload = request.get_json(silent=True) or {}
        user_id = get_user_id_from_request_body(payload)
        if not user_id:
            return jsonify({"error": "JSON body must include 'userId'."}), 400

        pick_side = payload.get("pick") or payload.get("pickSide") or payload.get("pick_side") or payload.get("side")
        game_id = get_game_id_from_request_body(payload)
        external_id = payload.get("externalId") if isinstance(payload.get("externalId"), str) else None

        try:
            stored_pick = save_user_pick(
                user_id=user_id,
                pick_side=pick_side,
                game_identifier=game_id,
                external_id=external_id,
            )
        except (requests.RequestException, RuntimeError, ValueError, PredictionValidationError, PredictionNotFoundError, PredictionLockedError) as exc:
            error_payload, status_code = prediction_error_response(exc)
            return jsonify(error_payload), status_code

        return jsonify({"pick": stored_pick}), 200

    @app.delete("/api/picks")
    def remove_pick():
        payload = request.get_json(silent=True) or {}
        user_id = (
            request.args.get("userId")
            or request.args.get("user_id")
            or get_user_id_from_request_body(payload)
        )
        game_id = (
            request.args.get("gameKey")
            or request.args.get("gameId")
            or request.args.get("game_id")
            or get_game_id_from_request_body(payload)
        )
        external_id = request.args.get("externalId")
        if not external_id and isinstance(payload.get("externalId"), str):
            external_id = payload["externalId"]

        if not user_id:
            return jsonify({"error": "A user identifier is required."}), 400
        if not game_id and not external_id:
            return jsonify({"error": "A game identifier is required."}), 400

        try:
            result = clear_user_pick(
                user_id=user_id,
                game_identifier=game_id,
                external_id=external_id,
            )
        except (requests.RequestException, RuntimeError, ValueError, PredictionValidationError, PredictionNotFoundError, PredictionLockedError) as exc:
            error_payload, status_code = prediction_error_response(exc)
            return jsonify(error_payload), status_code

        return jsonify(result), 200

    @app.get("/api/leaderboard")
    def get_leaderboard():
        season_year, season_error = parse_int_arg(
            "season",
            config.default_season_year,
            2000,
            2100,
        )
        if season_error:
            payload, status_code = season_error
            return jsonify(payload), status_code

        week, week_error = parse_optional_int_arg("week", 1, 18)
        if week_error:
            payload, status_code = week_error
            return jsonify(payload), status_code

        limit, limit_error = parse_int_arg("limit", 25, 1, 100)
        if limit_error:
            payload, status_code = limit_error
            return jsonify(payload), status_code

        try:
            leaderboard = build_leaderboard(
                season_year=season_year,
                week=week,
                limit=limit,
            )
        except (requests.RequestException, RuntimeError, ValueError, PredictionValidationError, PredictionNotFoundError, PredictionLockedError) as exc:
            error_payload, status_code = prediction_error_response(exc)
            return jsonify(error_payload), status_code

        response = {
            "entries": leaderboard["entries"],
            "meta": {
                "count": len(leaderboard["entries"]),
                "season": season_year,
                "week": week,
                "limit": limit,
            },
        }

        if not leaderboard["entries"]:
            response["message"] = "No picks found. Submit picks before requesting the leaderboard."

        return jsonify(response)

    return app


app = create_app()

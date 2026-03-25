from __future__ import annotations

import argparse

from backend.importer import sync_games


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fetch NFL games from ESPN and store them in Supabase.")
    parser.add_argument("--season", type=int, help="NFL season year to import, for example 2025.")
    parser.add_argument("--week", type=int, help="NFL regular-season week to import, 1-18.")
    parser.add_argument(
        "--seed-only",
        action="store_true",
        help="Skip the live API fetch and import the bundled seed file only.",
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()
    result = sync_games(
        season_year=args.season,
        week=args.week,
        seed_only=args.seed_only,
    )

    if result["imported"] == 0:
        for error in result["errors"]:
            print(error)
        raise SystemExit(
            f"No games imported for season {result['season_year']} week {result['week']}."
        )

    print(
        "Imported "
        f"{result['imported']} games for season {result['season_year']} week {result['week']} "
        f"using {result['source']} data."
    )
    for error in result["errors"]:
        print(error)


if __name__ == "__main__":
    main()

from __future__ import annotations

from backend.config import load_config
from backend.database import ensure_schema_file


def main() -> None:
    config = load_config()
    schema_path = ensure_schema_file(config)
    print(f"Supabase schema written to {schema_path}")
    print("Run that SQL in the Supabase SQL Editor before syncing games or posting picks.")


if __name__ == "__main__":
    main()

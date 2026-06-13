"""Tiny CLI wrapper around uvicorn for ``qcommerce`` console script.

Usage:

    qcommerce serve [--host HOST] [--port PORT] [--reload]
"""

from __future__ import annotations

import argparse
import sys

import uvicorn


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="qcommerce")
    sub = parser.add_subparsers(dest="cmd", required=True)

    serve = sub.add_parser("serve", help="Run the API with uvicorn")
    serve.add_argument("--host", default="127.0.0.1")
    serve.add_argument("--port", type=int, default=8000)
    serve.add_argument("--reload", action="store_true")

    sync = sub.add_parser(
        "sync-catalog",
        help="Pull the product catalog from upstream Supabase into local Postgres.",
    )
    sync.add_argument(
        "--truncate",
        action="store_true",
        help="Delete all local rows first (full refresh). Default: upsert by ASIN.",
    )
    sync.add_argument(
        "--batch-size",
        type=int,
        default=500,
        help="Rows per upsert statement. Smaller = shorter locks, more round-trips.",
    )

    args = parser.parse_args(argv if argv is not None else sys.argv[1:])

    if args.cmd == "serve":
        uvicorn.run(
            "app.main:app",
            host=args.host,
            port=args.port,
            reload=args.reload,
        )
        return 0

    if args.cmd == "sync-catalog":
        from app.services.catalog_sync import run_sync

        stats = run_sync(truncate=args.truncate, batch_size=args.batch_size)
        print(
            f"sync-catalog complete: fetched={stats.fetched} "
            f"inserted={stats.inserted} updated={stats.updated} "
            f"skipped_invalid={stats.skipped_invalid} "
            f"elapsed={stats.elapsed_seconds:.2f}s"
        )
        return 0

    return 1


if __name__ == "__main__":
    raise SystemExit(main())

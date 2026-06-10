#!/bin/sh
set -e

if ! alembic upgrade head; then
  echo "Alembic upgrade failed; stamping existing dev schema and retrying latest migration."
  alembic stamp 20260427_0002
  alembic upgrade head
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir app

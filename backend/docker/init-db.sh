#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# Postgres init script (runs ONCE, only when the data volume is empty).
#
# Applies the Flyway-style SQL migrations shipped in backend/migrations, in
# version order (V1, V2, … V10, V11). We sort with `sort -V` because a plain
# alphabetical sort would run V10/V11 before V2.
#
# Mounted by docker-compose into /docker-entrypoint-initdb.d/ so the official
# postgres image executes it automatically on first startup.
# ─────────────────────────────────────────────────────────────────────────────
set -e

MIGRATIONS_DIR=/migrations

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "[init-db] No migrations directory mounted at $MIGRATIONS_DIR — skipping."
  exit 0
fi

echo "[init-db] Applying migrations from $MIGRATIONS_DIR ..."
for file in $(ls "$MIGRATIONS_DIR"/V*.sql | sort -V); do
  echo "[init-db]   → $(basename "$file")"
  psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f "$file"
done
echo "[init-db] All migrations applied successfully."

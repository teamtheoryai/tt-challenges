#!/bin/sh
# Import environment state snapshots, when present.
#
# The box's runtime state can ship as opaque snapshots in state/:
#   state/postgres.sql.gz   — a database state image (applied over the schema)
#   state/minio-data.tar.gz — object-storage data + live policy state
#
# `make up` calls this after the stack starts. With no snapshot files present
# (a clean development boot), it does nothing.
set -e
cd "$(dirname "$0")/.."

imported=""

if [ -f state/postgres.sql.gz ]; then
  echo "[state] importing database snapshot…"
  gunzip -c state/postgres.sql.gz | docker compose exec -T db psql -q -U brain -d secondbrain
  imported="yes"
fi

if [ -f state/minio-data.tar.gz ]; then
  echo "[state] importing object-storage snapshot…"
  docker compose cp state/minio-data.tar.gz minio:/tmp/minio-state.tar.gz
  docker compose exec minio sh -c 'tar xzf /tmp/minio-state.tar.gz -C / && rm /tmp/minio-state.tar.gz'
  docker compose restart minio >/dev/null 2>&1
  imported="yes"
fi

if [ -n "$imported" ]; then
  echo "[state] environment state imported."
fi

# state/

Environment state snapshots. When snapshot files are present here
(`postgres.sql.gz`, `minio-data.tar.gz`), `make up` imports them into the
running services after boot — they define the box's starting runtime state.

They are opaque data images, not source. There is nothing in them to read or
diff; the way to understand the running system is to interrogate it live
(`make psql`, the MinIO console, service logs, `/api/status`).

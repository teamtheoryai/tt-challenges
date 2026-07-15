# Architecture — the Second Brain, in the box

The service-by-service tour. The README has the one-page map; this is the level below it. Everything runs locally via `docker compose` (see `docker-compose.yml`), and every service's *declared* configuration lives in `infra/`.

This box deliberately mirrors Team Theory's production shape — React SPA, Hono API, an agent graph, S3 + queue-driven ingestion, Postgres with row-level security — swapped onto local equivalents (MinIO for S3, ElasticMQ for SQS, a Postgres container for the managed database).

## Services

### web (:5173) — `apps/web`
React 18 + Vite + TanStack Query. Four views: Dashboard (portfolio + System Status), Documents (upload + pipeline state, polled), Ask the Brain (Q&A with citations), Talent Review (scores + per-score evidence). The Vite dev server proxies `/api/*` to the api service. "Auth" is picking a user — the browser sends `x-user-id`, and *the database* decides what that user sees.

### api (:4000) — `apps/api`
Hono on Node. Routes: users/me/orgs (directory + session), documents (list, multipart upload), ask (proxies to the agent), talent-review + executives (scores with sources), status (the ops readout).

Two database roles, deliberately:
- **`app_user`** — every user-facing query. Runs with `app.user_id` set per request; row-level security applies. See `apps/api/src/db.js`.
- **`brain` (owner)** — the status readout only (org-agnostic system counts).

Uploads: file → S3 `PutObject` (as the `api-svc` service account) → `documents` row (`status = uploaded`) → message on `documents-inbox`.

### agent (:4100) — `apps/agent`
The answer graph — the same node/edge/conditional-edge pattern our production agents use (a minimal local implementation of the LangGraph style, `src/graph.js`):

```
prepare ──(has question?)──▶ retrieve ──▶ answer ──▶ END
    └────────(empty)────────────────────▶ answer
```

`retrieve` embeds the question and pulls the nearest chunks from pgvector **through the same RLS boundary as the API** — the asking user's visibility applies to retrieval, so answers can't leak across orgs. `answer` composes a grounded response with citations: via Anthropic when `ANTHROPIC_API_KEY` is set, otherwise a deterministic local mode that quotes the best passage. Both modes cite; an answer with no citations is flagged `grounded: false`.

### pipeline — `apps/pipeline`
Two queue workers plus housekeeping, one container:

- **reader** — consumes `documents-inbox`: fetch the object from S3 (as `pipeline-svc`), extract text, mark the document `processing`, hand off to `documents-chunks`.
- **chunker** — consumes `documents-chunks`: split (~1100-char, paragraph-preserving), embed (256-dim local hashed embedding — `packages/shared/embedding.js`, shared with the agent so queries and documents live in one vector space), write chunks transactionally, mark `processed`.
- **digest** — a once-a-minute rollup line in the logs. Heartbeat only; not part of ingestion.

Failure behavior: a worker that throws leaves the message un-deleted; after 3 receives it redrives to the matching `*-dlq` (declared in `infra/elasticmq/elasticmq.conf`). Failed documents carry their error on the row and show up red in the UI and in `/api/status`.

### seeder (one-shot) — `apps/seeder`
First boot only: pushes every markdown file in `data/` through the real upload path (S3 → queue → pipeline), so the box's ingestion state is earned, not faked. Guarded by `system_flags.corpus_seeded`.

### db (:5432) — Postgres 16 + pgvector
Declared schema in `infra/db/init/` (applied on first boot of the volume):
- `001_schema.sql` — orgs/users, documents/chunks (vector(256), HNSW index), executives/scores/score_sources.
- `002_rls.sql` — **the isolation boundary.** `app_visible_orgs()`: fund users see every org; portco users see only their own. RLS policies on all org-scoped tables; `app_user` holds least privilege.
- `003_seed.sql` — the DAW world: 4 orgs, 4 users, 11 executives with scores and per-score sources.

`make psql` gives a direct shell. Live truth about policies: `select * from pg_policies;`.

### minio (:9000 API, :9001 console) — object storage
One bucket (`uploads`). Two service accounts with least-privilege policies declared in `infra/minio/*.json` and applied by the `minio-init` one-shot: `api-svc` (put/get/list) and `pipeline-svc` (get/list). Console login: `minio-root` / `minio-secret` — the console shows live buckets, objects, and **live policy state**.

### queue (:9324) — ElasticMQ (SQS-compatible)
Topology declared in `infra/elasticmq/elasticmq.conf`: `documents-inbox` and `documents-chunks`, each with a DLQ after 3 failed receives. Queue depths surface in `/api/status` and on the dashboard.

## Cross-cutting

- **Isolation is a database property.** Nothing in the app layer filters orgs by hand; every user-facing query runs as `app_user` with `app.user_id` set, and RLS does the rest. If isolation is broken, the database is where to look first.
- **Declared vs. running.** `infra/` is what *should* be true; the containers hold what *is* true. The gap between the two is a real thing to check: `pg_policies` vs. `002_rls.sql`, the MinIO console vs. `infra/minio/*.json`, live queue attributes vs. `elasticmq.conf`.
- **`data/` vs. `context-brain/`.** `data/` is what the app ingests and serves (the portco documents). `context-brain/` is reference for *you* — customer and product context. The app never reads `context-brain/`.
- **Ports:** web 5173 · api 4000 · agent 4100 · db 5432 · minio 9000/9001 · queue 9324.

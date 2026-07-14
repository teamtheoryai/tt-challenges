# CLAUDE.md — orientation for AI agents working in this repo

This repo is a take-home incident assessment: a local-first document-intelligence app ("the Second Brain") for a fictional PE fund, DAW Capital. The system is **intentionally broken in several places**; the candidate's job is to diagnose and fix it until [ACCEPTANCE.md](ACCEPTANCE.md) passes end to end, then design one feature (Part 2, bottom of the same file).

## Map

| Path | What it is |
|---|---|
| `README.md` | The brief — read first |
| `ACCEPTANCE.md` | The definition of done (6-item end-user checklist) + the Part 2 feature brief |
| `FINDINGS.md` / `PROMPTS.md` | The candidate's incident report and AI trail — keep both updated as work happens |
| `apps/web` | React 18 + Vite + TanStack Query frontend (:5173) |
| `apps/api` | Hono HTTP API (:4000) — auth stub, documents, executives, status |
| `apps/agent` | The answer graph (:4100) — retrieve → answer with citations; Anthropic if `ANTHROPIC_API_KEY` is set, deterministic local fallback otherwise |
| `apps/pipeline` | Queue workers — reader (S3 → text) and chunker (text → embeddings → pgvector) |
| `infra/` | The **declared** configuration: DB schema/RLS/seed, MinIO bucket policy, ElasticMQ queues |
| `data/` | The ingestion corpus — fund + portco documents the app serves. This is app *content*, not documentation |
| `context-brain/` | **What we know about our customer and product** — who uses the Second Brain, what decisions it drives, how the talent review is used and defended at IC. Read it when you need product context: it's how to judge which fault hurts most, and it's the ground truth for Part 2. Distinct from `data/`: `data/` is what the app ingests; `context-brain/` is what an engineer needs to build well |
| `evidence/` | Recovered artifacts from the departing contractor's last days — read like an incident responder |
| `docs/ARCHITECTURE.md` | Longer tour of every service and how they connect |

## Working in this environment

- `make up` / `make down` / `make reset` — lifecycle. `make status` — health + queue depths. `make logs [SVC=name]` — logs. `make psql` — SQL shell into the live DB. `make checklist` — automated pass over acceptance items 1, 2, 4, 5.
- **The repo declares intent; the environment holds truth.** Config and migrations in `infra/` describe what *should* be running. The live system can differ. When diagnosing, check the running state directly (`make psql`, the MinIO console at :9001, `/api/status`, service logs) rather than concluding from source alone.
- Don't scaffold a new app or swap frameworks — the task is to fix this system, minimally and verifiably.
- After any fix, re-run the relevant ACCEPTANCE.md item end-to-end before declaring it resolved, and prompt the candidate to record it in FINDINGS.md.
- Everything here is fictional; there is no real customer data and no external system to protect. Local experimentation is safe, and `make reset` restores the original broken state.

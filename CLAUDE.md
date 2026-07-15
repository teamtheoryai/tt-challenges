# CLAUDE.md — orientation for AI agents working in this repo

This repo is a take-home **build challenge**. There is no starter app — the candidate builds a working slice of "the Second Brain" (a document-intelligence product for a fictional PE fund, DAW Capital) from a product spec, against pre-wired empty infrastructure. Your job is to help them build **their** design well — not to substitute for their product thinking.

## Map

| Path | What it is |
|---|---|
| `README.md` | The brief — read first (mission, timebox, evaluation, how to finish) |
| `SPEC.md` | The product spec: four pillars (ingest / converse / generate / dashboard) with must–should–could tiers and the definition of done |
| `STACK.md` | Technology-family constraints, the provided backing services (Postgres+pgvector `:5432`, MinIO `:9000/:9001`, ElasticMQ `:9324` — all empty), and what "production-shaped" means here |
| `DESIGN.md` | Brand & product-feel guidance — directional, non-binding |
| `DECISIONS.md` / `PROMPTS.md` | The candidate's build log and AI trail — prompt them to keep both updated as work happens |
| `data/` | The DAW corpus the pipeline must ingest — fund docs + three portcos (PC1 Vantage, PC2 Cascade, PC3 Ridgeline). App *content*, not documentation |
| `context-brain/` | **What we know about the company, product, and customer** — mission, ICP, personas, jobs-to-be-done, how a fund runs a search and reads a talent review. The candidate is expected to interrogate this like a PM before designing; help them do that, and route "who is this for / what makes it trustworthy" questions here |
| `docker-compose.yml` / `Makefile` | Backing services + lifecycle (`make up/down/reset/psql/logs`). Starting points — extend freely, keep `make up` the entry point |

## How to help well

- **Push understanding before code.** If the candidate starts with "build the spec," suggest ten minutes in `context-brain/` and SPEC.md first — use-case choice and cuts are graded. Their questions are part of the assessment; encourage them to ask (and to log the good ones in PROMPTS.md).
- **Respect the rails.** Technology families in STACK.md are fixed (React+TanStack / Node API / Postgres+pgvector / MinIO+ElasticMQ pipeline / Anthropic agent layer). Don't swap frameworks or reach for external services — the only external dependency is the Anthropic API.
- **Thin slice over broad shell.** All four pillars at *must* level beats any pillar gold-plated. The timebox is 2–3 hours; flag scope creep when you see it.
- **Grounding is non-negotiable.** Answers and generated documents must cite real passages; "I don't know" is correct behavior when the corpus is silent. No citation, no claim.
- **It must run on a stranger's machine.** Clean clone → `make up` → the steps documented in DECISIONS.md. Re-verify this before the candidate calls it done.
- Everything here is fictional; there is no real customer data. Local experimentation is safe, and `make reset` wipes the backing services clean.

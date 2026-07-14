# The Incident — Team Theory Technical Assessment

Welcome, and thanks for making the time. This is the whole assessment — one repo, one broken system, one goal.

## The situation

DAW Capital — a lower-middle-market PE fund — runs its people decisions on a **Second Brain**: an AI system that ingests each portfolio company's documents and turns them into searchable knowledge, grounded answers, and a portfolio-wide **talent review**.

**It was working Friday.** Over the weekend, a departing contractor made changes across the system. Monday morning, users are reporting it's broken in several ways — some loud, some quiet.

You have the full repo and the running environment. One goal:

> **Make it work. "Done" = every item in [ACCEPTANCE.md](ACCEPTANCE.md) passes, as an end user sees it.**

Fix as many issues as you can inside the timebox. Anything you don't fix: tell us what you found, what you ruled out, and where you'd look next — **that counts as a complete submission.** An honest, specific map of what's still broken is worth more to us than a false "all green."

## Quick start

You need Docker Desktop (or compatible) and ~4GB free. If that's a problem, reply to your invite email and we'll sort out an alternative.

```bash
git clone <your repo>   # you're reading it
cd tt-challenges
cp .env.example .env    # optional: add an Anthropic key (see below)
make up                 # builds + starts the whole stack
```

Then open **http://localhost:5173**. Pick a user (there's no real auth — this is a local sandbox) and start looking around. `make help` lists every command; `make status` gives you a one-shot health readout; `make logs` tails everything.

**Heads up: the system is broken on arrival. That's the assessment.** If `make up` completes but the app misbehaves, you're in the right place — start diagnosing, not reinstalling.

## The system, on one page

Everything runs locally in Docker. It mirrors our real production stack (React / Hono / an agent graph / S3 / SQS / Postgres-with-RLS) — fixing this system is deliberately close to the day job.

```
                    ┌─────────────┐
   browser ────────▶│  web :5173  │  React 18 + Vite + TanStack Query
                    └──────┬──────┘
                           │ /api/*
                    ┌──────▼──────┐        ┌───────────────┐
                    │  api :4000  │───────▶│  agent :4100  │  graph: retrieve → answer (+ citations)
                    │    Hono     │        └───────┬───────┘
                    └──┬───┬──────┘                │
          uploads ─────┘   │                       │
                    ┌──────▼──────┐         ┌──────▼──────────────┐
                    │ minio :9000 │         │      db :5432       │
                    │ S3 (console │         │ Postgres + pgvector │
                    │  on :9001)  │         │  RLS per org        │
                    └──────┬──────┘         └──────▲──────────────┘
                           │ queue message         │ chunks + embeddings
                    ┌──────▼──────┐         ┌──────┴───────┐
                    │ queue :9324 │────────▶│   pipeline   │  reader → chunker (+ DLQs)
                    │  ElasticMQ  │         │   workers    │
                    └─────────────┘         └──────────────┘
```

The document flow: **upload → S3 (MinIO) → queue message → reader (extract text) → chunker (embed, write to pgvector) → document shows "Processed" → the agent can cite it.**

Where to look when something's off:

| Surface | What it tells you |
|---|---|
| **System Status panel** (on the dashboard, and `GET /api/status`) | per-service health, queue + DLQ depths, last processed document — *symptoms, not causes* |
| `make logs` / `make logs SVC=pipeline` | every service's stdout |
| `make psql` | a psql shell into the running database |
| MinIO console at http://localhost:9001 (`minio-root` / `minio-secret`) | buckets, objects, **bucket policies** |
| `infra/` | the *declared* configuration — what *should* be running |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | the longer tour of every service |

One thing worth saying plainly: the repo tells you what the system is *supposed* to look like. Only the running environment tells you what it *actually* looks like. Trust, but verify — against the live system.

## What you're working on

The assessment has two required parts. **Budget ~3 hours total: about two fixing, about one designing.** We mean it about the timebox — a tight, honest three hours is exactly what we want to see. Don't gold-plate.

### Part 1 — The Incident (~2 hours)

Diagnose and fix. Work [ACCEPTANCE.md](ACCEPTANCE.md) like an end user would; prioritize like an operator would (who is hurt by what? [context-brain/](context-brain/) can tell you). Record every issue in [FINDINGS.md](FINDINGS.md) as you go — symptom, root cause, fix, and **how you verified it** — including the ones you didn't get to.

A rough shape for the two hours: ~20 min orienting (`make up`, read this page, poke the app) · ~75 min diagnosing and fixing · ~25 min FINDINGS.md and a final end-to-end pass of the checklist.

### Part 2 — The Feature (~1 hour, required — a sketch counts as much as a build)

The full brief is at the bottom of [ACCEPTANCE.md](ACCEPTANCE.md). Short version: our fund's partners tell us they don't fully trust a talent-review score they can't interrogate. **Make the talent review something a partner could defend at their investment committee.** A feature, a view, a capability, a redesign — built into the box or sketched on paper. Spend about an hour, no more; in the review you'll walk us through what you'd build and why. We score the thinking and the walkthrough, not the polish.

## Resources — what's available to you

- **The whole repo.** Every service's source, the declared infrastructure config in `infra/`, the ingestion corpus in `data/`.
- **[context-brain/](context-brain/)** — what we know about our customer and product: who uses the Second Brain, what decisions it drives, how the talent review is read and by whom. It exists so you can reason from the customer, not just the code. Especially useful for triage priorities and for Part 2.
- **[evidence/](evidence/)** — artifacts recovered from the contractor's last days: an access-policy snapshot, an audit-log excerpt, a handover note. Read them the way an incident responder would.
- **The live environment** — logs, `make psql`, the MinIO console, queue depths via `/api/status`. Interrogate it.
- **Your AI tools.** Use whatever you'd normally reach for — Claude Code, Cursor, anything. The repo's [CLAUDE.md](CLAUDE.md) orients an AI agent. We *want* to see how you drive AI on a real incident; keep the trail (see conventions below).
- **An Anthropic API key, on request.** The agent service runs fine without one (it falls back to a deterministic local answerer, and every issue is diagnosable key-free). If you want live LLM answers, reply to your invite email and we'll send a scoped, spend-capped key for your `.env`.
- **Us.** Reply to your assignment email any time — we're your product owner. Asking sharp questions is signal, not weakness.

## How we evaluate

We read your submission the way we'd read a colleague's incident response:

1. **Diagnosis over patches.** Did you find *root causes* and verify them, or hammer symptoms until they moved? "How I verified" is the most important column in FINDINGS.md.
2. **The checklist, as a user sees it.** Progress is measured against ACCEPTANCE.md end-to-end — not against "the service starts."
3. **Prioritization.** With limited time, what did you fix first, and why? Severity is about users and decisions, not noise volume. (This is where `context-brain/` earns its place.)
4. **An honest map.** Fixed-and-verified beats claimed. A submission with two solid fixes plus a specific, well-reasoned map of the rest **outranks** one that claims everything works when it doesn't.
5. **How you drove your AI.** We read PROMPTS.md and your commit history as one story: what you delegated, what you verified, where you overrode the tool. AI steered well is a strength; AI output pasted unverified is the failure mode we screen for.
6. **Part 2 product thinking.** Who's the user, what decision are they making, what did you cut, what would you ship first. Scored separately from Part 1 — a sketch with sharp reasoning scores as well as a build.

There is no hidden scoring trick beyond this list. We aren't timing you to the minute and there are no points for suffering — stop at the timebox.

## Working conventions

- **Commit as you go**, with real messages. Your history is part of the story ("fix RLS policy on documents" beats "wip").
- **Keep your AI trail in [PROMPTS.md](PROMPTS.md).** Export or paste the prompts/transcripts that mattered, with a line on what you took, rejected, or redirected. We read it, and we'll dig into it in the review.
- **Record findings in [FINDINGS.md](FINDINGS.md) as you go**, not from memory at the end.

## How you finish — definition of done

You are done when **either** every ACCEPTANCE.md item passes end-to-end, **or** your timebox is up — whichever comes first. Then:

1. **Run the checklist one last time** (`make checklist` automates most of it; do the items it can't reach by hand) and record the final state of each item in FINDINGS.md.
2. **Commit and push everything**: your fixes, `FINDINGS.md`, `PROMPTS.md`, and your Part 2 artifact (code, or a write-up/sketch — `PART2.md`, images, whatever fits).
3. **Reply to your invite email** with the repo link, then **book the 60-minute review** (link in the same email).

A complete submission = pushed repo + FINDINGS.md (with unfixed items mapped) + PROMPTS.md + a Part 2 artifact. That's it — no PR, no deployment, no slides.

### The review (60 min)

You'll walk us through your diagnosis and your Part 2 thinking, and we'll debug one more issue together live on your machine, same box. Nothing to prepare beyond having the environment able to start.

---

*Everything in this repo — the fund, the companies, the people, the documents — is fictional. No real client data. Have fun with it; we're looking forward to seeing how you think.*

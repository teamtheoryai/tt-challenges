# Challenge B — Knowledge Base / Second Brain

## The problem

> We want a fund and all its portfolio companies to have a shared "second brain" — drop in documents, board decks, assessments, notes, and then ask questions across all of it. Multi-tenant, LLM-powered. How would you build the ingestion-to-answer pipeline?

Intentionally open. **Ask us questions** before you build — what kind of docs, what kind of questions, how fresh the answers need to be. Reply to your assignment email any time while you're building — we're your product owner.

## The goal

A working slice of the **ingest → chunk → embed → store → retrieve → answer** pipeline, multi-tenant from the first line. We want to see you reason about chunking, embedding/storage choices, retrieval quality, and — critically — **how tenant isolation survives all the way into the prompt** (no cross-portco data leaking into an answer). A running demo that ingests a few real docs and answers one grounded, cited question beats a perfect diagram.

## How to approach it

- **Timebox it to ~2–3 hours** and don't gold-plate it. What you choose to prove and what you deliberately cut is signal — scoping a fuzzy problem under a limit is part of what we're looking at.
- **Think about the *why*, not just the *what*** — and be ready to walk us through your reasoning in the review, including the shape in plain language: "when X happens the data goes here, and when someone asks for Y we read from there."
- **Ask us anything.** Reply to your assignment email any time while you're building — we're your product owner.
- **Use any stack and tools you like, AI assistants included.** Commit your prompt logs to your fork as `PROMPTS.md` — how you work with AI is signal we *want* to see.
- **Show off.** If you join, this is your platform. Build it the way you'd want to own it.

## Background & where to look

- The corpus to ingest: [`../data/`](../data/) — real, messy, multi-format documents per portfolio company:
  - `portcos/PC*/inbox/markdown/` — board decks, leadership assessments, value-creation plans, 360 feedback, interview notes, target scorecards, org due-diligence.
  - `portcos/PC*/inbox/office/` — original-format sources (`.docx`/`.pptx`/`.xlsx`) if you want to show off multi-format ingestion.
  - `fund/` — fund-level source docs (strategy, thesis) if you want fund-wide context in the corpus too.
  - Note: the *digested* knowledge layer (company overviews, executive profiles) is deliberately **not** in here — building that queryable layer from the raw docs is the point of this challenge.
- Architecture & isolation rules: [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md). In production: uploads → S3 via presigned URL → async processing → embed with Bedrock Titan v2 → vector storage **partitioned by organization** → retrieval feeds Anthropic under Zero Data Retention. Cross-org vectors must never enter a prompt.
- Three portcos in different industries (IT services, healthcare, logistics) — useful for testing that a question about one doesn't pull context from another.

## Things worth resolving out loud

- Chunking: fixed-size? semantic? per-document-type? (A board deck, a 360, and a scorecard table behave very differently.)
- Freshness: is eventual consistency after ingest fine, or must answers be instant?
- Citations: should answers point back to the source doc + location? (The data supports it — every fact is traceable.)
- Isolation: same index for all portcos with a filter, or separate stores? What's the failure mode of each?

## Getting started

1. Skim [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) and a couple of docs under `../data/portcos/PC1/inbox/markdown/`.
2. Pick one portco to get the pipeline working end-to-end, then show how it stays isolated when a second portco's docs are added.
3. Copy the repo-root `.env.example` to `.env` for your Anthropic key (we'll provide it).

# Challenge C — Portfolio Talent Dashboard

## The problem

> A DAW Capital talent partner wants to open **one screen** and understand the health of leadership across their whole portfolio. Build us that screen.

That's intentionally open. Part of the session is you figuring out what that screen should actually be — so **ask us questions.** Reply to your assignment email any time while you're building — we're your product owner.

## The goal

A **functional, end-to-end slice**: read the data → serve it → render a real view that a talent partner could actually use to make a decision. Product thinking counts as much as code — what earns a spot on the screen, and what gets cut? A rough thing that runs and tells the right story beats a polished thing that doesn't.

## How to approach it

- **Timebox it to ~2–3 hours** and don't gold-plate it. What you choose to prove and what you deliberately cut is signal — scoping a fuzzy problem under a limit is part of what we're looking at.
- **Think about the *why*, not just the *what*** — and be ready to walk us through your reasoning in the review, including the shape in plain language: "when X happens the data goes here, and when someone asks for Y we read from there."
- **Ask us anything.** Reply to your assignment email any time while you're building — we're your product owner.
- **Use any stack and tools you like, AI assistants included.** Commit your prompt logs to your fork as `PROMPTS.md` — how you work with AI is signal we *want* to see.
- **Show off.** If you join, this is your platform. Build it the way you'd want to own it.

## Background & where to look

- The data: [`data/`](data/) (right here in this folder) — timestamped talent-review snapshots + `manifest.json`. One immutable file per agent run per portco, so there's a version history.
- **Read this first:** [`DATA_DICTIONARY.md`](DATA_DICTIONARY.md) — the full schema, including the 1.0 → 1.1 evolution you'll want to handle gracefully.
- The talent-review JSON is self-contained — you have everything you need there. For extra color on a company, the raw source docs under [`../data/portcos/PC*/inbox/`](../data/portcos/) (board decks, assessments, scorecards) line up with the JSON.
- Product context: Team Theory is **not a chat interface** — it's purpose-built decision surfaces (cockpits, heat maps, dashboards). See [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md). This screen should feel like a decision surface, not a report.

## Getting started

1. Serve the data (or load it however your stack prefers — it's just files):
   ```bash
   # from this folder:
   cd data && python3 -m http.server 8080   # data at http://localhost:8080
   # or run it through your own stack's dev server / bundler
   ```
2. Start with `manifest.json`, resolve the latest snapshot per portco, and go.
3. Optional AI feature (e.g. "summarize this portco's risks")? There's an `ANTHROPIC_API_KEY` slot in the repo-root `.env.example`; we'll hand you a key.

Three portcos, multiple execs each, full performance/risk/succession signal per leader. Plenty to build something real within your ~2–3 hour timebox.

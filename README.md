# Team Theory — Technical Assessment Challenges

Welcome, and thanks for making the time. This repo holds everything for the **take-home technical assessment**: a shared dataset and a set of self-contained challenges. We'll point you at **one** challenge — open that folder's `README.md` and build it **on your own time, timeboxed to ~2–3 hours.** Afterwards you'll book a 60-minute review where you walk us through what you built.

There's no trick and no hidden right answer. We want to see how you actually work: how you frame an open-ended ask, how you make decisions under a time box, and what you choose to prove versus cut. **Ask us questions** — reply to your assignment email any time while you're building; we're your product owner. Please **timebox it to ~2–3 hours and don't gold-plate** — we care more about your judgment than a finished product.

## What we're looking for

- **Own the judgment.** Make the calls you'd make and note the trade-offs. In the review you'll walk us through your reasoning, so build in a way you can explain — we care more about *why* than *what*.
- **Ask questions.** The ask is deliberately open. Probe it as you build — who's the user, what does "done" look like in your timebox, what matters most. Reply to your assignment email any time; charging ahead on unstated assumptions is the thing we're watching for.
- **Show off your AI-native skills.** Use whatever AI tools you'd normally reach for. How you prompt, when you trust the output, and when you override it is signal we *want* to see — don't hide it.
- **Export your prompt logs.** When you're done, save your AI chat/prompt transcript and commit it into your fork as `PROMPTS.md` alongside your work. It's a real part of how you built this, and we'll read it (and dig into it in the review).

## The world you're working in

Everything centers on one fictional but realistic private-equity fund:

**DAW Capital** — a lower-middle-market PE firm that buys control of established businesses and creates value primarily through *people and leadership*. It owns three portfolio companies:

| Portco | Company | Sector |
|---|---|---|
| **PC1** | Vantage Managed Services | IT managed services (MSP) |
| **PC2** | Cascade Care Group | Healthcare provider services |
| **PC3** | Ridgeline Freight & Logistics | Transportation & logistics |

An AI system (think: a "second brain" for the fund) ingests each company's documents and produces structured knowledge — company overviews, executive profiles, and timestamped **talent reviews** that score every leader on performance, risk of loss, and succession. That's the product world Team Theory builds in.

## Repo layout

```
.
├── README.md                      ← you are here
├── data/                          ← shared dataset (all challenges read from here)
│   ├── fund/
│   │   └── raw/                   raw fund-level source docs (strategy, thesis)
│   └── portcos/
│       ├── PC1/  PC2/  PC3/
│       │   └── inbox/             raw source docs (board decks, 360s, assessments, scorecards)
│       │       ├── markdown/      clean markdown extractions
│       │       └── office/        original-format sources (.docx/.pptx/.xlsx)
├── docs/
│   └── ARCHITECTURE.md            Team Theory's real architecture (context for system-design)
├── challenge-a-data-hierarchy/    system design + multi-tenant data modeling
├── challenge-b-knowledge-base/    ingestion → retrieval → grounded answers
├── challenge-c-portfolio-dashboard/  full-stack dashboard — ships with its own data/ + DATA_DICTIONARY.md
├── challenge-d-ll144-dossier/     research + product judgment (NYC Local Law 144)
├── docker-compose.yml             one-command static server for ./data
└── .env.example                   optional Anthropic API key slot
```

## Getting started

1. **Fork this repo** to your own GitHub account, then clone *your fork* — that's where your work lives and what we'll review afterward.
2. Open your assigned challenge folder and read its `README.md`. (We assign the challenge in your invite email.)
3. Poke around [`data/`](data/) (and, for Challenge C, the data + `DATA_DICTIONARY.md` inside that challenge's folder).
4. **Use any stack and any tools you like** — including AI assistants. Build it the way you'd actually build it.
5. If your challenge wants a live data endpoint:
   ```bash
   docker compose up        # serves ./data at http://localhost:8080
   # or, no Docker:
   cd data && python3 -m http.server 8080
   ```
6. Some challenges can optionally call Claude. Copy `.env.example` to `.env`; if your challenge needs LLM calls, ask and we'll send you a scoped key.
7. **When you're done:** commit your work *and* your prompt logs (`PROMPTS.md`) to your fork, and share the link. No need to open a PR — we'll review your fork directly. Then book your 60-minute review (link in your invite email).

Have fun with it — we're looking forward to seeing what you build.

# Team Theory — Paired Programming Challenges

Welcome, and thanks for making the time. This repo holds everything for the **live paired-programming session**: a shared dataset and a set of self-contained challenges. Your facilitator will point you at **one** challenge — open that folder's `README.md` and we'll build together for ~90 minutes.

There's no trick and no hidden right answer. We want to see how you actually work: how you think out loud, how you handle an open-ended ask, and how you make decisions under a little time pressure. **Ask us questions** — we're your product owner for the session.

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

1. Clone this repo.
2. Open your assigned challenge folder and read its `README.md`.
3. Poke around [`data/`](data/) (and, for Challenge C, the data + `DATA_DICTIONARY.md` inside that challenge's folder).
4. **Use any stack and any tools you like** — including AI assistants. Build it the way you'd actually build it.
5. If your challenge wants a live data endpoint:
   ```bash
   docker compose up        # serves ./data at http://localhost:8080
   # or, no Docker:
   cd data && python3 -m http.server 8080
   ```
6. Some challenges can optionally call Claude. Copy `.env.example` to `.env`; we'll hand you a key at the start.

Have fun with it — we're looking forward to building with you.

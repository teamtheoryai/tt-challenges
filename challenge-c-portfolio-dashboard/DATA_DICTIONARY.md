# Data Dictionary — Portfolio Talent Reviews

The data in [`../data/fund/portfolio-talent-reviews/`](../data/fund/portfolio-talent-reviews/) is a set of **talent-review snapshots**. Each file is one immutable run of the review agent for one portfolio company at one point in time. Re-running writes a *new* timestamped file — snapshots are never overwritten — so each portco has a version history.

## Files

### `manifest.json`
The index. Lists every snapshot with its portco, name, and generation time.

```jsonc
{
  "builtAt": "2026-06-13T13:15:36.681Z",
  "snapshots": [
    { "file": "talent-review_PC1_20260613T1300.json", "portco": "PC1",
      "portcoName": "Vantage Managed Services",
      "generatedAt": "2026-06-13T13:00:00Z", "runId": "run_20260613T1300" }
    // ...one entry per snapshot file
  ]
}
```
> "Latest review per portco" = group `snapshots` by `portco`, take the max `generatedAt`.

### `talent-review_<portco>_<ISO-timestamp>.json`
One full review. Top-level shape:

| Field | Type | Meaning |
|---|---|---|
| `schemaVersion` | string | `"1.0"` or `"1.1"` — **the schema evolved over time.** See below. |
| `fund` | string | `"DAW CAPITAL"`. |
| `portco` / `portcoName` | string | Portco id + display name. |
| `generatedAt` | ISO datetime | When this snapshot was produced. |
| `runId` | string | Unique id for the agent run. |
| `sourceDocuments` | array | Docs the agent read (path + ingest time). Paths point at real files under `data/portcos/<portco>/inbox/`. |
| `portcoSummary` | object | Portco-level rollup — see below. |
| `executives` | array | One object per executive — the bulk of the data. |
| `auditLog` | array | Ordered log of what the agent did this run (ingested / changed / flag), with reasons. |

### `portcoSummary`
| Field | Type | Meaning |
|---|---|---|
| `talentRiskRYG` | green/yellow/red | Overall talent-risk rating. |
| `evAtRisk` | number (USD) | Enterprise value at risk from people issues. |
| `trackingOnVCP` | RYG | Tracking the Value Creation Plan? |
| `trending` | up/down/neutral | Direction since last review. |
| `highPotentialCount` / `atRiskCount` | int | Counts. |
| `keyRisks` | string[] | Top portco-level risks. |
| `headline` | string | One-line summary. |

### `executives[]`
Fields you'll likely surface first are marked ★.

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Stable id (e.g. `pc1_ceo`). |
| ★ `name` / `role` | string | Executive name + title. |
| `interviewPerformance` | `{score, ryg, basis}` | Assessed performance at hire/DD. `score` is 1–5. |
| ★ `currentStatePerformance` | `{score, ryg}` | Performance today. |
| `futureStatePerformance` | `{score, ryg}` | Fit for where the role is going. |
| `indicatorsOfSuccess3to6mo` | string[] | Near-term success markers. |
| ★ `riskOfLoss` | `{level, ryg}` | Likelihood they leave. |
| ★ `highPotential` | bool | Hi-po flag. |
| `successionShortTerm` / `successionLongTerm` | `{successor, readiness}` | Bench depth (`ready-now`/`developing`/`gap`). |
| `quarterlyPerformance` | `[{quarter, score}]` | Trend series — good for a sparkline. |
| `successionReadiness` | `{level, ryg}` | Bench-strength rollup. |
| `tenureMonths` | int | Months in seat. |
| `directCost` | number (USD) | Comp / direct cost. |
| ★ `estimatedEVImpact` | number (USD) | EV tied to this person. |
| `whatDroveEVErosion` | string \| null | If they've cost value, why. |
| `trackingOnVCP` | `{status, ryg}` | ahead/on-track/behind. |
| `trending` | up/down/neutral | Direction since last review. |
| `signal` | `{strength, confidence}` | Evidence backing the assessment (`confidence` 0–1). |
| ★ `nineBox` | `{performance, potential, cell}` | 9-box placement; `cell` like `"1A"`. |
| `keyRisks` / `suggestedActions` / `derisicingQuestions` | string[] | Risks, actions, open questions. |
| `additionalComments` | string | Assessor's note. |
| `actionability` | `{recommendation, level}` | What to do + urgency. |
| `evidence` | array | Quotes backing specific fields. Shape differs by schema version (below). |
| `flags` | string[] | e.g. `key-person-risk`, `hi-po`, `below-plan`, `low-signal`. |
| `deviations` | array | Contradictions in the evidence (e.g. stakeholder disagreement). |
| `riskMitigations` | string[] | Mitigations in flight. |

## Schema evolution: 1.0 → 1.1

The dataset contains **both versions** (always check `schemaVersion`). A robust consumer handles both — this is deliberate.

**1.0** (earlier snapshots) — `evidence[]` objects are:
```jsonc
{ "field": "...", "quote": "...", "document": "...", "location": "...", "speaker": "...", "type": "supporting" }
```

**1.1** (later snapshots) adds, per executive:
- **richer `evidence[]`** — extra fields `finding` (paraphrase), `documentTitle`, `speakerRole`.
- a new **`insights[]`** array — pre-computed narrative cards that reference evidence by index:
  ```jsonc
  {
    "id": "pc1_ceo_i1",
    "evidenceRefs": [0, 1],          // indices into this exec's evidence[]
    "type": "key-risk",              // key-risk | suggested-action | ...
    "severity": "warning",           // info | warning | ...
    "title": "Key risk",
    "detail": "Over-weights net-new logos vs. same-client NRR",
    "relevantFields": ["currentStatePerformance", "estimatedEVImpact", ...]
  }
  ```

## Notes & quirks (real data is messy — that's the point)

- **RYG everywhere** — `green`/`yellow`/`red` at every level. A clean visual language for it goes a long way.
- **Scores are 1–5**; `signal.confidence` is 0–1.
- **History is real** — multiple snapshots per portco, hours/days apart; the `auditLog` even records field-level changes with reasons. Room for a "what changed since last review" view.
- **Evidence is traceable** — every important rating ties back to a quote + source document that exists under `data/portcos/`. Surfacing that traceability is on-brand for the product.
- **Not every field is populated** on every exec. Defend against nulls and missing `insights[]` (1.0 files have none).

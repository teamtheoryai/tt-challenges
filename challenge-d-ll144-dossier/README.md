# Challenge D — NYC Local Law 144 Compliance Dossier

This one is less "deploy a server," more "watch you think." It tests research ability, regulatory literacy, product judgment, and whether you understand **our own exposure as a company** — not just our customers'. It also doubles as a real deliverable: whoever builds it best is producing something we actually need.

## The problem

> New York City has a law — Local Law 144 — about bias audits for automated tools used in hiring. Our customers are PE firms making hiring decisions, and we're the AI in the loop. Build us something that (1) explains how Team Theory complies today, and (2) proposes product features that reduce legal and compliance friction for a PE firm's in-house legal team.

Intentionally open. **Ask us anything** about our data flows, our customers' workflows, and what legal teams actually push on. We're your product owner for the session.

## The goal

A **document or artifact** — your choice of format (memo, spec, annotated diagram, mini-site) — that:
1. Accurately explains Team Theory's current LL144 posture, and **critically assesses whether Team Theory itself is an AEDT** under the law — not just whether our customers are exposed.
2. Proposes **concrete, buildable product features** that reduce legal/compliance friction for PE in-house legal teams.

We're evaluating depth of synthesis and product judgment — not Google skills. The primer below gives you the raw material; the signal is what you *do* with it.

## How we'll run it

- **Share your screen** — research, notes, drafting, all of it.
- **Think out loud** — we want to hear you reason about *our* exposure, not just recite the statute.
- **Ask us anything** — about our architecture, our customers, what trips up legal review.
- **Use any tools you like**, including AI assistants and web search.
- **Show off** — this is a real artifact we'll use. Treat it like one.

## Background — LL144 in brief

- **NYC Local Law 144 of 2021**, enforced by the Dept. of Consumer and Worker Protection (DCWP). Enforcement began **July 5, 2023**.
- Regulates **Automated Employment Decision Tools (AEDTs)** — a computational process (ML, statistical modeling, data analytics, AI) that issues a **simplified output** (score, classification, recommendation) used to **substantially assist or replace** discretionary employment decisions (hiring or promotion).
- Requirements **before use**: (a) an **independent bias audit** within the prior year; (b) **public posting** of the audit's summary of results + distribution date; (c) **notice** to NYC candidates/employees at least **10 business days** before use, including the job qualifications the tool assesses and, on request, the data collected.
- The bias audit computes **selection rates and impact ratios** across sex and race/ethnicity categories (and intersections).
- Penalties: **$500–$1,500 per violation, per day.**

### The hard question (we won't hand you the answer)
Is Team Theory an AEDT? We produce scores, assessments, and recommendations that may "substantially assist" a hiring decision — but a human makes the call. The line between "decision support" and "AEDT" is exactly where the product and legal judgment lives. Reason about it out loud.

### Team Theory's data flows & current posture
- Candidate/executive data is uploaded by the customer → research + assessment via Anthropic/Mistral under **Zero Data Retention** → structured scorecards/assessments → surfaced to the talent partner, who decides. See [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).
- Current compliance strengths are **security/privacy** controls: ZDR with AI providers (no training on customer data), Row-Level Security tenant isolation, org-scoped access, no bulk export. **Note what these do *not* cover** — none of it is an LL144 bias audit. Spotting that gap is part of the test.

### What this data looks like in practice
[`../data/`](../data/) holds real examples of the system's inputs and scored outputs — assessments and scorecards that rate executives (`portcos/PC*/inbox/markdown/target-scorecards.md`, `leadership-assessment-2026.md`, `360-feedback-2026.md`). These are exactly the kind of "simplified outputs" / scoring LL144 cares about — useful concrete material to ground your analysis.

## Things worth resolving out loud

- Is Team Theory the AEDT vendor, or a sub-processor? Who owns the bias audit and the candidate notice — us or the PE firm?
- "Reduce compliance friction" — is the feature a bias-audit-artifact generator, a notice-automation flow, an audit-trail/explainability layer, or a "this role is in NYC → here's your checklist" guardrail? Pick and justify.
- Does our security/privacy posture actually address LL144 at all? (Largely a different axis — strong answers say so.)

## Getting started

Skim the primer above, [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md), and a couple of assessment/scorecard docs under `../data/portcos/`. Then build your artifact in whatever form makes the argument best. Drop your work in this folder.

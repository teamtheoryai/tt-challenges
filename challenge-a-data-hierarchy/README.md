# Challenge A — Rearchitect the Data Hierarchy

## The problem

> We're moving from serving funds to also serving every portfolio company underneath each fund. Our current data model assumes one tenant per organization. Help us figure out how the data should be structured so this works — and so it doesn't fall over when we have a fund with dozens of portcos under it.

Intentionally open. Before you design anything, **ask us questions.** We're your product owner for the session.

## The goal

A defensible **data hierarchy + tenancy model** for fund → portco → executive/review, with the access-pattern and isolation trade-offs reasoned out loud. We want a migration path that **doesn't require a full app-layer rewrite**, and a clear story for how tenant isolation extends to a nested hierarchy. A running proof-of-concept of the schema and a couple of access patterns is a bonus, not the bar — the thinking is the point.

## How we'll run it

- **Share your screen** and keep it shared — schema sketches, code, terminal, all of it.
- **Think out loud**, and be able to explain the shape in plain language: "when X happens, the data goes here, and when someone asks for Y, we read from there."
- **Ask us anything** — how many portcos per fund, read- vs write-heavy, who sees what, what "done" looks like in 60 minutes.
- **Use any tools you like**, including AI assistants.
- **Show off.** This is the foundation the whole product scales on. Build it the way you'd want to own it.

## Background & where to look

- The shape of the world: [`../data/`](../data/) — `fund/` sits above `portcos/PC1·PC2·PC3`, each portco with its own executives and document history. That fund → portco → people nesting *is* the hierarchy you're modeling.
- Real architecture & tenancy today: [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md). Key facts: the platform is **organization-scoped** today (one org per fund), with tenant isolation enforced at the **database layer** via Postgres Row-Level Security — an app bug can't leak across orgs. DynamoDB holds agent state; S3 holds files; embeddings are partitioned by org.
- The expansion: a **Portco Workspace** product sits *under* a fund. Portco leaders get scoped access to their own data; the fund partner sees across all their portcos; no portco sees another. Some people/reviews are fund-level, some portco-level, some move between.

## Things worth resolving out loud

- Is a portco its own tenant, or a sub-tenant of the fund? (No single right answer — we want the trade-off.)
- What happens to an executive assessed in a fund-level review who then moves into a portco? Who owns/sees that data?
- The product's edge is *compounding cross-portco intelligence*. Does that collide with strict isolation? Where's the line?

## Getting started

1. Read [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) and skim [`../data/`](../data/) to see the entities and how they nest today.
2. Sketch the target model, then prove out whatever slice best demonstrates it (schema + a query or two, in any stack).

# Team Theory — Architecture Brief

Context for the challenges. You don't need to reproduce this — it's here so you understand the real system you'd be building in, and so a system-design conversation has a concrete starting point.

## Team Theory in one paragraph

An AI platform for PE talent partners — it automates candidate research, reference synthesis, leadership assessments, role/interview design, and portfolio talent monitoring, with **compounding portfolio memory** (every search and assessment makes the system smarter). It's **multi-tenant and organization-scoped**: a fund is a tenant, and the roadmap extends down to per-portfolio-company workspaces.

## Stack (production)

| Layer | Choices |
|---|---|
| **Compute** | AWS serverless in `us-east-1` — Lambda, API Gateway V2 (HTTP API), SQS + DLQ for async jobs, a dedicated Lambda URL for SSE streaming |
| **Primary data** | Supabase Postgres with **Row-Level Security** — tenant isolation enforced *at the database layer*, so an app bug can't leak across orgs |
| **Agent state** | DynamoDB (AI agent / conversation state) |
| **Files** | S3; uploads go straight to S3 via short-lived **presigned URLs** (large payloads never touch the API) |
| **Vectors** | AWS-managed vector storage; embeddings via **Bedrock Titan v2**; partitioned by organization key |
| **AI** | Anthropic (primary) + Mistral, called from inside the VPC, both under **Zero Data Retention** (no customer data stored or trained on) |
| **Auth** | JWT RS256; org membership verified on every request |
| **Frontend** | React 18 + TanStack Query |
| **IaC** | SST / CloudFormation |

## Why isolation matters here

Team Theory's customers are PE firms handling sensitive people data. **Security and data isolation are the #1 enterprise conversion gate** — not an afterthought. Multi-tenant isolation that holds at the database layer, organization-partitioned embeddings (no cross-org data in any prompt), and ZDR with AI providers are load-bearing product features, not nice-to-haves. Keep that instinct in mind in any design discussion.

## The talent-review backend (relevant to several challenges)

The talent-review dataset (shipped inside [`../challenge-c-portfolio-dashboard/data/`](../challenge-c-portfolio-dashboard/data/)) models how the real system stores agent output:

- One **immutable, timestamped JSON snapshot** per agent run, per portco: `talent-review_<portco>_<ISO-timestamp>.json`.
- Snapshots are **never overwritten** — a re-run writes a new file, giving each portco a version history.
- `manifest.json` indexes every snapshot. "Latest per portco" = group by `portco`, take max `generatedAt`.
- Schema evolves over time (see [DATA_DICTIONARY.md](../challenge-c-portfolio-dashboard/DATA_DICTIONARY.md)) — earlier snapshots are `schemaVersion 1.0`, later ones `1.1`.

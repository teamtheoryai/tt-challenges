-- Declared schema for the Second Brain. Applied on first boot of the db volume.
create extension if not exists vector;

-- ── Tenancy ────────────────────────────────────────────────────────────────
-- One fund; portcos hang under it. Isolation is org-scoped and enforced at
-- the database layer (see 002_rls.sql) — an app bug must not leak across orgs.
create table orgs (
  id            serial primary key,
  slug          text unique not null,
  name          text not null,
  kind          text not null check (kind in ('fund', 'portco')),
  parent_org_id int references orgs(id)
);

create table users (
  id     serial primary key,
  email  text unique not null,
  name   text not null,
  role   text not null,
  org_id int not null references orgs(id)
);

-- ── Documents & retrieval ──────────────────────────────────────────────────
create table documents (
  id           uuid primary key default gen_random_uuid(),
  org_id       int not null references orgs(id),
  title        text not null,
  s3_key       text not null,
  content_type text not null default 'text/markdown',
  status       text not null default 'uploaded'
               check (status in ('uploaded', 'processing', 'processed', 'failed')),
  error        text,
  uploaded_by  int references users(id),
  uploaded_at  timestamptz not null default now(),
  processed_at timestamptz
);

create table chunks (
  id          bigserial primary key,
  document_id uuid not null references documents(id) on delete cascade,
  org_id      int not null references orgs(id),
  seq         int not null,
  content     text not null,
  embedding   vector(256) not null,
  unique (document_id, seq)
);

create index chunks_embedding_idx on chunks using hnsw (embedding vector_cosine_ops);
create index chunks_org_idx on chunks (org_id);
create index documents_org_idx on documents (org_id);

-- ── Talent review ──────────────────────────────────────────────────────────
create table executives (
  id     serial primary key,
  org_id int not null references orgs(id),
  name   text not null,
  title  text not null
);

-- One row per executive per dimension: performance / risk_of_loss / succession_readiness.
create table scores (
  id           serial primary key,
  executive_id int not null references executives(id) on delete cascade,
  org_id       int not null references orgs(id),
  dimension    text not null check (dimension in ('performance', 'risk_of_loss', 'succession_readiness')),
  score        numeric(2,1) not null check (score between 1.0 and 5.0),
  rationale    text not null,
  unique (executive_id, dimension)
);

-- The evidence behind a score. `weight` is how heavily the scorer leaned on it.
-- `document_ref` points at the source in data/ (or an uploaded document id).
create table score_sources (
  id           serial primary key,
  score_id     int not null references scores(id) on delete cascade,
  org_id       int not null references orgs(id),
  source_type  text not null check (source_type in
                 ('board_deck', '360_feedback', 'leadership_assessment',
                  'reference_call', 'interview_notes', 'self_assessment')),
  document_ref text not null,
  note         text not null,
  weight       numeric(3,2) not null default 0.50 check (weight between 0 and 1)
);

-- ── System ─────────────────────────────────────────────────────────────────
create table system_flags (
  key    text primary key,
  value  text not null,
  set_at timestamptz not null default now()
);

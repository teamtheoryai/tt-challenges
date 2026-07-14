-- Declared row-level security. The API and agent connect as app_user and set
-- app.user_id per request; these policies are the isolation boundary.
-- Fund-level users see every org under the fund; portco users see only their own.

create role app_user login password 'app_pass';

-- Which orgs can the current request's user see?
create or replace function app_visible_orgs()
returns setof int
language sql stable security definer
as $$
  select o.id
  from orgs o
  cross join users u
  where u.id = nullif(current_setting('app.user_id', true), '')::int
    and (
      o.id = u.org_id
      or exists (select 1 from orgs f where f.id = u.org_id and f.kind = 'fund')
    );
$$;

alter table documents     enable row level security;
alter table chunks        enable row level security;
alter table executives    enable row level security;
alter table scores        enable row level security;
alter table score_sources enable row level security;

create policy documents_org_select on documents
  for select using (org_id in (select app_visible_orgs()));
create policy documents_org_insert on documents
  for insert with check (org_id in (select app_visible_orgs()));

create policy chunks_org_select on chunks
  for select using (org_id in (select app_visible_orgs()));

create policy executives_org_select on executives
  for select using (org_id in (select app_visible_orgs()));

create policy scores_org_select on scores
  for select using (org_id in (select app_visible_orgs()));

create policy score_sources_org_select on score_sources
  for select using (org_id in (select app_visible_orgs()));

-- orgs and users carry no row-level secrets (the login picker needs them);
-- everything sensitive hangs off org-scoped tables above.
grant usage on schema public to app_user;
grant select on orgs, users, system_flags to app_user;
grant select, insert on documents to app_user;
grant select on chunks, executives, scores, score_sources to app_user;
grant usage, select on all sequences in schema public to app_user;

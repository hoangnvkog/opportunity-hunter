-- ============================================================================
-- Migration: 20260604140400_create_opportunities.sql
-- Purpose : Create the `opportunities` table.
-- Spec    : docs/DATABASE_DESIGN.md
--             - id
--             - cluster_id
--             - score
--             - frequency
--             - severity
--             - buying_intent
--
-- Notes   : Spec names the score column `score`, not `opportunity_score`.
--           Spec has no `created_at`. We honour both.
-- ============================================================================

create table if not exists public.opportunities (
  id            uuid        primary key default gen_random_uuid(),
  cluster_id    uuid        not null references public.pain_clusters(id) on delete cascade,
  score         numeric(6,3) not null,
  frequency     integer     not null default 0,
  severity      numeric(4,3) not null,
  buying_intent numeric(4,3) not null,

  constraint opportunities_score_range          check (score         between 0 and 100),
  constraint opportunities_frequency_nonneg    check (frequency     >= 0),
  constraint opportunities_severity_range      check (severity      between 0 and 1),
  constraint opportunities_buying_intent_range check (buying_intent between 0 and 1)
);

-- Indexes -------------------------------------------------------------------
create index if not exists opportunities_cluster_id_idx     on public.opportunities (cluster_id);
create index if not exists opportunities_score_idx          on public.opportunities (score desc);
create index if not exists opportunities_frequency_idx      on public.opportunities (frequency desc);
create index if not exists opportunities_buying_intent_idx  on public.opportunities (buying_intent desc);
-- Composite for "top opportunities per cluster"
create index if not exists opportunities_cluster_score_idx  on public.opportunities (cluster_id, score desc);

-- Documentation -------------------------------------------------------------
comment on table  public.opportunities                is 'Scored opportunities, summarised from a pain cluster.';
comment on column public.opportunities.id             is 'Primary key (UUID v4).';
comment on column public.opportunities.cluster_id     is 'FK -> pain_clusters.id.';
comment on column public.opportunities.score          is 'Derived opportunity score in [0, 100]. Higher = better.';
comment on column public.opportunities.frequency      is 'Number of pain points mapped to this opportunity.';
comment on column public.opportunities.severity       is 'Severity in [0, 1].';
comment on column public.opportunities.buying_intent  is 'Buying intent in [0, 1].';

-- Row Level Security --------------------------------------------------------
alter table public.opportunities enable row level security;

drop policy if exists "service_role_full_access_opportunities" on public.opportunities;
create policy "service_role_full_access_opportunities"
  on public.opportunities
  for all
  to service_role
  using (true)
  with check (true);

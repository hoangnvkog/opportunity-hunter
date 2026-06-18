-- ============================================================================
-- Migration: 20260604140200_create_pain_points.sql
-- Purpose : Create the `pain_points` table.
-- Spec    : docs/DATABASE_DESIGN.md
--             - id
--             - raw_post_id
--             - pain
--             - category
--             - severity
--             - buying_intent
--             - created_at
-- ============================================================================

create table if not exists public.pain_points (
  id            uuid        primary key default gen_random_uuid(),
  raw_post_id   uuid        not null references public.raw_posts(id) on delete cascade,
  pain          text        not null,
  category      text        not null,
  severity      numeric(4,3) not null,
  buying_intent numeric(4,3) not null,
  created_at    timestamptz not null default now(),

  constraint pain_points_pain_length          check (char_length(pain)     between 1 and 2000),
  constraint pain_points_category_length      check (char_length(category) between 1 and 100),
  constraint pain_points_severity_range       check (severity      between 0 and 1),
  constraint pain_points_buying_intent_range  check (buying_intent between 0 and 1)
);

-- Indexes -------------------------------------------------------------------
create index if not exists pain_points_raw_post_id_idx  on public.pain_points (raw_post_id);
create index if not exists pain_points_category_idx     on public.pain_points (category);
create index if not exists pain_points_severity_idx     on public.pain_points (severity desc);
create index if not exists pain_points_buying_intent_idx on public.pain_points (buying_intent desc);
create index if not exists pain_points_created_at_idx   on public.pain_points (created_at desc);

-- Documentation -------------------------------------------------------------
comment on table  public.pain_points                is 'Pain points extracted from raw posts.';
comment on column public.pain_points.id             is 'Primary key (UUID v4).';
comment on column public.pain_points.raw_post_id    is 'FK -> raw_posts.id. The post this pain was extracted from.';
comment on column public.pain_points.pain           is 'Pain statement.';
comment on column public.pain_points.category       is 'Normalized category (e.g. "billing", "onboarding").';
comment on column public.pain_points.severity       is 'Severity score in [0, 1].';
comment on column public.pain_points.buying_intent  is 'Buying intent score in [0, 1].';
comment on column public.pain_points.created_at     is 'Timestamp the row was created.';

-- Row Level Security --------------------------------------------------------
alter table public.pain_points enable row level security;

drop policy if exists "service_role_full_access_pain_points" on public.pain_points;
create policy "service_role_full_access_pain_points"
  on public.pain_points
  for all
  to service_role
  using (true)
  with check (true);

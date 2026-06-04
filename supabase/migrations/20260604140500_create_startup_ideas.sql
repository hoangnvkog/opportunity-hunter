-- ============================================================================
-- Migration: 20260604140500_create_startup_ideas.sql
-- Purpose : Create the `startup_ideas` table.
-- Spec    : docs/DATABASE_DESIGN.md
--             - id
--             - opportunity_id
--             - problem
--             - solution
--             - mvp
--             - pricing
--
-- Notes   : Spec has no `target_customer` and no `created_at`. We honour both.
-- ============================================================================

create table if not exists public.startup_ideas (
  id             uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  problem        text not null,
  solution       text not null,
  mvp            text not null,
  pricing        text not null,

  constraint startup_ideas_problem_len  check (char_length(problem)  between 1 and 2000),
  constraint startup_ideas_solution_len check (char_length(solution) between 1 and 2000),
  constraint startup_ideas_mvp_len      check (char_length(mvp)      between 1 and 2000),
  constraint startup_ideas_pricing_len  check (char_length(pricing)  between 1 and 1000)
);

-- Indexes -------------------------------------------------------------------
create index if not exists startup_ideas_opportunity_id_idx on public.startup_ideas (opportunity_id);

-- Documentation -------------------------------------------------------------
comment on table  public.startup_ideas                 is 'Concrete startup ideas derived from opportunities.';
comment on column public.startup_ideas.id              is 'Primary key (UUID v4).';
comment on column public.startup_ideas.opportunity_id  is 'FK -> opportunities.id.';
comment on column public.startup_ideas.problem         is 'Short problem statement.';
comment on column public.startup_ideas.solution        is 'Proposed solution / product description.';
comment on column public.startup_ideas.mvp             is 'Minimum viable product description.';
comment on column public.startup_ideas.pricing         is 'Pricing model / price point summary.';

-- Row Level Security --------------------------------------------------------
alter table public.startup_ideas enable row level security;

drop policy if exists "service_role_full_access_startup_ideas" on public.startup_ideas;
create policy "service_role_full_access_startup_ideas"
  on public.startup_ideas
  for all
  to service_role
  using (true)
  with check (true);

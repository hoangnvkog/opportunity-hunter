/**
 * Sprint 56: Startup Investment Scoring Engine
 *
 * Migration: create startup_scores table
 * VC-style due diligence scoring for validated opportunities.
 *
 * Pipeline stage 10 (NEW): only runs when ALL three gates pass:
 *   - validation_score >= 70
 *   - forecast_score >= 70
 *   - market_intelligence overall_score >= 70
 *
 * Dimensions scored (each 0-100):
 *   - tam_score            (Total Addressable Market size)
 *   - market_timing_score  (window of opportunity)
 *   - competition_score    (crowdedness, inverse — higher = less crowded)
 *   - moat_score           (defensibility)
 *   - distribution_score   (go-to-market channel strength)
 *   - execution_score      (team/capability to ship)
 *   - capital_efficiency_score (revenue / capital ratio)
 *
 * + overall_score (weighted average), confidence (0-100),
 *   recommendation (text: "Strong Invest" / "Watch" / "Pass"),
 *   summary (analyst write-up).
 */

-- Create startup_scores table
create table if not exists startup_scores (
  id uuid primary key default gen_random_uuid(),

  opportunity_id uuid not null
    references opportunities(id)
    on delete cascade,

  tam_score numeric(5,2) not null default 0
    check (tam_score >= 0 and tam_score <= 100),

  market_timing_score numeric(5,2) not null default 0
    check (market_timing_score >= 0 and market_timing_score <= 100),

  competition_score numeric(5,2) not null default 0
    check (competition_score >= 0 and competition_score <= 100),

  moat_score numeric(5,2) not null default 0
    check (moat_score >= 0 and moat_score <= 100),

  distribution_score numeric(5,2) not null default 0
    check (distribution_score >= 0 and distribution_score <= 100),

  execution_score numeric(5,2) not null default 0
    check (execution_score >= 0 and execution_score <= 100),

  capital_efficiency_score numeric(5,2) not null default 0
    check (capital_efficiency_score >= 0 and capital_efficiency_score <= 100),

  overall_score numeric(5,2) not null default 0
    check (overall_score >= 0 and overall_score <= 100),

  confidence numeric(5,2) not null default 0
    check (confidence >= 0 and confidence <= 100),

  recommendation text,

  summary text,

  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_startup_scores_opportunity
  on startup_scores(opportunity_id);

create index if not exists idx_startup_scores_overall_score
  on startup_scores(overall_score);

create index if not exists idx_startup_scores_recommendation
  on startup_scores(recommendation);

-- RLS
alter table startup_scores enable row level security;

-- Policies: owner + admin full access
create policy "startup_scores_owner_all"
  on startup_scores
  for all
  using (
    opportunity_id in (
      select id from opportunities
      where user_id = auth.uid()
    )
  );

create policy "startup_scores_admin_all"
  on startup_scores
  for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );
/**
 * Sprint 55: Market Intelligence Engine
 *
 * Migration: create market_intelligence table
 * Stores aggregated external market signals for validated opportunities.
 *
 * Pipeline stage 9: ONLY generates market intelligence when
 *   - validation_score >= 70
 *   - forecast_score >= 70
 *
 * Signals aggregated (each 0-100):
 *   - reddit_score
 *   - github_score
 *   - product_hunt_score
 *   - news_score
 *   - google_trends_score
 *   - jobs_score
 *
 * + overall_score (weighted average), confidence (0-100), summary (text).
 */

-- Create market_intelligence table
create table if not exists market_intelligence (
  id uuid primary key default gen_random_uuid(),

  opportunity_id uuid not null
    references opportunities(id)
    on delete cascade,

  reddit_score numeric(5,2) not null default 0
    check (reddit_score >= 0 and reddit_score <= 100),

  github_score numeric(5,2) not null default 0
    check (github_score >= 0 and github_score <= 100),

  product_hunt_score numeric(5,2) not null default 0
    check (product_hunt_score >= 0 and product_hunt_score <= 100),

  news_score numeric(5,2) not null default 0
    check (news_score >= 0 and news_score <= 100),

  google_trends_score numeric(5,2) not null default 0
    check (google_trends_score >= 0 and google_trends_score <= 100),

  jobs_score numeric(5,2) not null default 0
    check (jobs_score >= 0 and jobs_score <= 100),

  overall_score numeric(5,2) not null default 0
    check (overall_score >= 0 and overall_score <= 100),

  confidence numeric(5,2) not null default 0
    check (confidence >= 0 and confidence <= 100),

  summary text,

  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_intelligence_opportunity
  on market_intelligence(opportunity_id);

create index if not exists idx_intelligence_overall_score
  on market_intelligence(overall_score);

-- RLS
alter table market_intelligence enable row level security;

-- Policies: owner + admin full access
create policy "intelligence_owner_all"
  on market_intelligence
  for all
  using (
    opportunity_id in (
      select id from opportunities
      where user_id = auth.uid()
    )
  );

create policy "intelligence_admin_all"
  on market_intelligence
  for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );
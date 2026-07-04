-- Sprint 66: AI Venture Score Engine
-- New table: venture_scores
-- Deterministic aggregation of all venture analysis signals into a single
-- investment-grade score (0-100). NO AI/score generation happens here —
-- this table only persists computed venture scores.

create table if not exists venture_scores (
  id uuid primary key default gen_random_uuid(),

  opportunity_id uuid not null
    references opportunities(id)
    on delete cascade,

  -- Final aggregate score (0-100)
  overall_score numeric(5,2) not null default 0
    check (overall_score >= 0 and overall_score <= 100),

  -- Investment grade (AAA, AA, A, BBB, BB, B, Reject)
  investment_grade text not null default 'Reject',

  -- Recommendation tier (Strong Buy, Buy, Watch, Speculative, Reject)
  recommendation text not null default 'Reject',

  -- Sub-scores (0-100 each)
  confidence_score numeric(5,2) not null default 0
    check (confidence_score >= 0 and confidence_score <= 100),

  risk_score numeric(5,2) not null default 0
    check (risk_score >= 0 and risk_score <= 100),

  roi_score numeric(5,2) not null default 0
    check (roi_score >= 0 and roi_score <= 100),

  market_score numeric(5,2) not null default 0
    check (market_score >= 0 and market_score <= 100),

  execution_score numeric(5,2) not null default 0
    check (execution_score >= 0 and execution_score <= 100),

  innovation_score numeric(5,2) not null default 0
    check (innovation_score >= 0 and innovation_score <= 100),

  financial_score numeric(5,2) not null default 0
    check (financial_score >= 0 and financial_score <= 100),

  validation_score numeric(5,2) not null default 0
    check (validation_score >= 0 and validation_score <= 100),

  forecast_score numeric(5,2) not null default 0
    check (forecast_score >= 0 and forecast_score <= 100),

  research_score numeric(5,2) not null default 0
    check (research_score >= 0 and research_score <= 100),

  -- Deterministic lists
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One venture score per opportunity
create unique index if not exists uq_venture_scores_opportunity
  on venture_scores(opportunity_id);

create index if not exists idx_venture_scores_overall
  on venture_scores(overall_score);

create index if not exists idx_venture_scores_recommendation
  on venture_scores(recommendation);

create index if not exists idx_venture_scores_grade
  on venture_scores(investment_grade);

-- RLS: same model as startup_scores
alter table venture_scores enable row level security;

create policy "venture_scores_owner_all"
  on venture_scores
  for all
  using (
    opportunity_id in (
      select id from opportunities
      where user_id = auth.uid()
    )
  );

create policy "venture_scores_admin_all"
  on venture_scores
  for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Service role bypass for backend jobs
create policy "venture_scores_service_role"
  on venture_scores
  for all
  using (auth.role() = 'service_role');

-- updated_at trigger
create trigger update_venture_scores_updated_at
  before update on venture_scores
  for each row execute function update_updated_at_column();

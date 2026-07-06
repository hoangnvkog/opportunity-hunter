-- Combined migration: create 7 missing tables
-- Applied 2026-07-06 to fix 500 errors on admin pages

-- 1. opportunity_backtests (Sprint 59)
create table if not exists opportunity_backtests (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  predicted_score decimal(6,3) not null,
  predicted_direction text,
  actual_score decimal(6,3),
  prediction_delta decimal(6,3),
  market_growth decimal(6,3),
  search_growth decimal(6,3),
  reddit_growth decimal(6,3),
  github_growth decimal(6,3),
  competitor_growth decimal(6,3),
  accuracy decimal(5,2),
  status text not null default 'pending',
  evaluation_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_backtests_opportunity_id on opportunity_backtests(opportunity_id);
create index if not exists idx_backtests_evaluation_date on opportunity_backtests(evaluation_date desc);
create index if not exists idx_backtests_status on opportunity_backtests(status);
create index if not exists idx_backtests_accuracy on opportunity_backtests(accuracy);

alter table opportunity_backtests enable row level security;
create policy "backtests_select_all" on opportunity_backtests for select using (true);
create policy "backtests_insert_all" on opportunity_backtests for insert with check (true);
create policy "backtests_update_all" on opportunity_backtests for update using (true);
create policy "backtests_delete_all" on opportunity_backtests for delete using (true);

-- 2. opportunity_evidence (Sprint 53)
create table if not exists opportunity_evidence (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  evidence_type text not null check (evidence_type in ('reddit','google_trend','competitor','market_report','pricing','customer_quote')),
  source text not null,
  title text not null,
  url text,
  summary text,
  confidence numeric(5,2) not null default 0 check (confidence >= 0 and confidence <= 100),
  created_at timestamptz not null default now()
);

create index if not exists idx_evidence_opportunity on opportunity_evidence(opportunity_id);
create index if not exists idx_evidence_type on opportunity_evidence(evidence_type);

alter table opportunity_evidence enable row level security;
create policy "evidence_owner_all" on opportunity_evidence for all using (opportunity_id in (select id from opportunities where true));
create policy "evidence_admin_all" on opportunity_evidence for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- 3. opportunity_forecasts (Sprint 54)
create table if not exists opportunity_forecasts (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  forecast_score numeric(5,2) not null check (forecast_score >= 0 and forecast_score <= 100),
  growth_probability numeric(5,2) not null check (growth_probability >= 0 and growth_probability <= 100),
  confidence numeric(5,2) not null check (confidence >= 0 and confidence <= 100),
  momentum numeric(5,2) not null check (momentum >= 0 and momentum <= 100),
  prediction_summary text,
  forecast_window_days integer not null default 30 check (forecast_window_days > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_forecast_opportunity on opportunity_forecasts(opportunity_id);
create index if not exists idx_forecast_score on opportunity_forecasts(forecast_score);

alter table opportunity_forecasts enable row level security;
create policy "forecast_owner_all" on opportunity_forecasts for all using (opportunity_id in (select id from opportunities where true));
create policy "forecast_admin_all" on opportunity_forecasts for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- 4. market_intelligence (Sprint 55)
create table if not exists market_intelligence (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  reddit_score numeric(5,2) not null default 0 check (reddit_score >= 0 and reddit_score <= 100),
  github_score numeric(5,2) not null default 0 check (github_score >= 0 and github_score <= 100),
  product_hunt_score numeric(5,2) not null default 0 check (product_hunt_score >= 0 and product_hunt_score <= 100),
  news_score numeric(5,2) not null default 0 check (news_score >= 0 and news_score <= 100),
  google_trends_score numeric(5,2) not null default 0 check (google_trends_score >= 0 and google_trends_score <= 100),
  jobs_score numeric(5,2) not null default 0 check (jobs_score >= 0 and jobs_score <= 100),
  overall_score numeric(5,2) not null default 0 check (overall_score >= 0 and overall_score <= 100),
  confidence numeric(5,2) not null default 0 check (confidence >= 0 and confidence <= 100),
  summary text,
  created_at timestamptz not null default now()
);

create index if not exists idx_intelligence_opportunity on market_intelligence(opportunity_id);
create index if not exists idx_intelligence_overall_score on market_intelligence(overall_score);

alter table market_intelligence enable row level security;
create policy "intelligence_owner_all" on market_intelligence for all using (opportunity_id in (select id from opportunities where true));
create policy "intelligence_admin_all" on market_intelligence for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- 5. startup_scores (Sprint 56)
create table if not exists startup_scores (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  tam_score numeric(5,2) not null default 0 check (tam_score >= 0 and tam_score <= 100),
  market_timing_score numeric(5,2) not null default 0 check (market_timing_score >= 0 and market_timing_score <= 100),
  competition_score numeric(5,2) not null default 0 check (competition_score >= 0 and competition_score <= 100),
  moat_score numeric(5,2) not null default 0 check (moat_score >= 0 and moat_score <= 100),
  distribution_score numeric(5,2) not null default 0 check (distribution_score >= 0 and distribution_score <= 100),
  execution_score numeric(5,2) not null default 0 check (execution_score >= 0 and execution_score <= 100),
  capital_efficiency_score numeric(5,2) not null default 0 check (capital_efficiency_score >= 0 and capital_efficiency_score <= 100),
  overall_score numeric(5,2) not null default 0 check (overall_score >= 0 and overall_score <= 100),
  confidence numeric(5,2) not null default 0 check (confidence >= 0 and confidence <= 100),
  recommendation text,
  summary text,
  created_at timestamptz not null default now()
);

create index if not exists idx_startup_scores_opportunity on startup_scores(opportunity_id);
create index if not exists idx_startup_scores_overall_score on startup_scores(overall_score);
create index if not exists idx_startup_scores_recommendation on startup_scores(recommendation);

alter table startup_scores enable row level security;
create policy "startup_scores_owner_all" on startup_scores for all using (opportunity_id in (select id from opportunities where true));
create policy "startup_scores_admin_all" on startup_scores for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- 6. venture_reports (Sprint 57) — depends on startup_scores
create table if not exists venture_reports (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  startup_score_id uuid not null references startup_scores(id) on delete cascade,
  title text not null,
  executive_summary text not null,
  problem text not null,
  market_analysis text not null,
  tam_analysis text not null,
  competition_analysis text not null,
  customer_segments text not null,
  business_model text not null,
  pricing_strategy text not null,
  go_to_market text not null,
  distribution_strategy text not null,
  product_roadmap text not null,
  technical_risks text not null,
  business_risks text not null,
  competitive_advantages text not null,
  moat_analysis text not null,
  financial_outlook text not null,
  recommendation text not null,
  confidence numeric(5,2) not null default 0 check (confidence >= 0 and confidence <= 100),
  report_version integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_venture_reports_opportunity on venture_reports(opportunity_id);
create index if not exists idx_venture_reports_created_desc on venture_reports(created_at desc);

alter table venture_reports enable row level security;
create policy "venture_reports_owner_all" on venture_reports for all using (opportunity_id in (select id from opportunities where true));
create policy "venture_reports_admin_all" on venture_reports for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- 7. investment_memos (Sprint 58) — depends on venture_reports + startup_scores
create table if not exists investment_memos (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  venture_report_id uuid not null references venture_reports(id) on delete cascade,
  investment_score_id uuid not null references startup_scores(id) on delete cascade,
  title text not null,
  thesis text not null,
  market text not null,
  problem text not null,
  solution text not null,
  business_model text not null,
  traction text not null,
  competition text not null,
  risks text not null,
  strengths text not null,
  why_now text not null,
  investment_decision text not null,
  recommendation text not null,
  confidence numeric(5,2) not null default 0 check (confidence >= 0 and confidence <= 100),
  memo_version integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_investment_memos_opportunity on investment_memos(opportunity_id);
create index if not exists idx_investment_memos_created_desc on investment_memos(created_at desc);

alter table investment_memos enable row level security;
create policy "investment_memos_owner_all" on investment_memos for all using (opportunity_id in (select id from opportunities where true));
create policy "investment_memos_admin_all" on investment_memos for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

/**
 * Sprint 54: Opportunity Forecast Engine
 *
 * Migration: create opportunity_forecasts table
 * Stores AI-generated forecasts for validated opportunities.
 *
 * Pipeline stage 8: ONLY generates forecasts when validation_score >= 70 AND trend_score >= 60.
 */

-- Create opportunity_forecasts table
create table if not exists opportunity_forecasts (
  id uuid primary key default gen_random_uuid(),

  opportunity_id uuid not null
    references opportunities(id)
    on delete cascade,

  forecast_score numeric(5,2) not null
    check (forecast_score >= 0 and forecast_score <= 100),

  growth_probability numeric(5,2) not null
    check (growth_probability >= 0 and growth_probability <= 100),

  confidence numeric(5,2) not null
    check (confidence >= 0 and confidence <= 100),

  momentum numeric(5,2) not null
    check (momentum >= 0 and momentum <= 100),

  prediction_summary text,

  forecast_window_days integer not null default 30
    check (forecast_window_days > 0),

  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_forecast_opportunity
  on opportunity_forecasts(opportunity_id);

create index if not exists idx_forecast_score
  on opportunity_forecasts(forecast_score);

-- RLS
alter table opportunity_forecasts enable row level security;

-- Policies: owner + admin full access
create policy "forecast_owner_all"
  on opportunity_forecasts
  for all
  using (
    opportunity_id in (
      select id from opportunities
      where user_id = auth.uid()
    )
  );

create policy "forecast_admin_all"
  on opportunity_forecasts
  for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );
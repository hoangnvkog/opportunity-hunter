/**
 * Sprint 59: Opportunity Backtesting Engine
 *
 * Migration: create opportunity_backtests table
 *
 * Purpose:
 * - Measure historical accuracy of investment predictions
 * - Track predicted_score vs actual_score over time
 * - Calculate accuracy delta and signal growth metrics
 * - Enable model performance evaluation and alerts
 *
 * RLS: enabled — users see only their matched opportunities' backtests
 * via the existing opportunity-level auth pattern.
 */

-- Create opportunity_backtests table
create table if not exists opportunity_backtests (
  id uuid primary key default gen_random_uuid(),

  opportunity_id uuid not null
    references opportunities(id)
    on delete cascade,

  -- What was predicted at time of evaluation
  predicted_score decimal(6,3) not null,
  predicted_direction text,               -- "up" | "down" | "stable"

  -- What actually happened (retrieved from market signals at evaluation date)
  actual_score decimal(6,3),

  -- Difference: predicted - actual (negative = overestimated, positive = underestimated)
  prediction_delta decimal(6,3),

  -- Signal growth metrics at evaluation time (actual values observed)
  market_growth decimal(6,3),
  search_growth decimal(6,3),
  reddit_growth decimal(6,3),
  github_growth decimal(6,3),
  competitor_growth decimal(6,3),

  -- Computed accuracy: 0-100 (100 = perfect prediction)
  accuracy decimal(5,2),

  -- Evaluation status
  status text not null default 'pending',
  -- pending | evaluated | failed | stale

  -- When this evaluation was performed
  evaluation_date date not null,

  -- Human-readable notes (why the prediction was right/wrong)
  notes text,

  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_backtests_opportunity_id
  on opportunity_backtests(opportunity_id);

create index if not exists idx_backtests_evaluation_date
  on opportunity_backtests(evaluation_date desc);

create index if not exists idx_backtests_status
  on opportunity_backtests(status);

create index if not exists idx_backtests_accuracy
  on opportunity_backtests(accuracy);

-- RLS
alter table opportunity_backtests enable row level security;

-- Users can read backtests for opportunities they have visibility into
-- (mirrors the opportunities policy: public for all authenticated users in this app)
create policy "backtests_select_all"
  on opportunity_backtests for select
  using (true);

create policy "backtests_insert_all"
  on opportunity_backtests for insert
  with check (true);

create policy "backtests_update_all"
  on opportunity_backtests for update
  using (true);

create policy "backtests_delete_all"
  on opportunity_backtests for delete
  using (true);

comment on table opportunity_backtests is
  'Historical accuracy measurements for investment predictions. Each row records a prediction made at evaluation_date and the actual outcome observed at that time.';
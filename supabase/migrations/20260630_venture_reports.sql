/**
 * Sprint 57: AI Venture Research Report Generator
 *
 * Migration: create venture_reports table
 * Generates investment-grade research reports for opportunities
 * with startup_score >= 80 (investment grade).
 *
 * Pipeline stage 11 (NEW): runs after Investment Score stage.
 * Only generates when startup_score overall_score >= 80.
 *
 * Report structure mirrors VC research documents (YC, a16z, Sequoia style).
 */

-- Create venture_reports table
create table if not exists venture_reports (
  id uuid primary key default gen_random_uuid(),

  opportunity_id uuid not null
    references opportunities(id)
    on delete cascade,

  startup_score_id uuid not null
    references startup_scores(id)
    on delete cascade,

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

  confidence numeric(5,2) not null default 0
    check (confidence >= 0 and confidence <= 100),

  report_version integer not null default 1,

  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_venture_reports_opportunity
  on venture_reports(opportunity_id);

create index if not exists idx_venture_reports_created_desc
  on venture_reports(created_at desc);

-- RLS
alter table venture_reports enable row level security;

-- Policies: owner + admin full access
create policy "venture_reports_owner_all"
  on venture_reports
  for all
  using (
    opportunity_id in (
      select id from opportunities
      where user_id = auth.uid()
    )
  );

create policy "venture_reports_admin_all"
  on venture_reports
  for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );
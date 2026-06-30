/**
 * Sprint 58: Investment Memo Generator
 *
 * Migration: create investment_memos table
 * Generates concise, decision-oriented investment memos for top
 * opportunities (startup_score overall_score >= 85).
 *
 * Pipeline stage 12 (NEW): runs after Venture Report stage.
 * Only generates when startup_score overall_score >= 85.
 *
 * Memo structure mirrors internal memos used by
 * Y Combinator, Sequoia, Andreessen Horowitz, Accel.
 *
 * Each memo anchors 1-to-1 to the venture report + investment score that
 * triggered it (FKs cascade on delete).
 */

-- Create investment_memos table
create table if not exists investment_memos (
  id uuid primary key default gen_random_uuid(),

  opportunity_id uuid not null
    references opportunities(id)
    on delete cascade,

  venture_report_id uuid not null
    references venture_reports(id)
    on delete cascade,

  investment_score_id uuid not null
    references startup_scores(id)
    on delete cascade,

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

  confidence numeric(5,2) not null default 0
    check (confidence >= 0 and confidence <= 100),

  memo_version integer not null default 1,

  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_investment_memos_opportunity
  on investment_memos(opportunity_id);

create index if not exists idx_investment_memos_created_desc
  on investment_memos(created_at desc);

-- RLS
alter table investment_memos enable row level security;

-- Policies: owner + admin full access
create policy "investment_memos_owner_all"
  on investment_memos
  for all
  using (
    opportunity_id in (
      select id from opportunities
      where user_id = auth.uid()
    )
  );

create policy "investment_memos_admin_all"
  on investment_memos
  for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );
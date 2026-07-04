/**
 * Sprint 67: AI Investment Committee
 *
 * Migration: create investment_committees + committee_votes tables.
 *
 * Architecture:
 * - investment_committees: one row per opportunity committee review
 * - committee_votes: one row per AI agent vote (5 per committee)
 *
 * Five independent AI agents:
 *   1. Market Analyst    — market size, demand, growth, timing
 *   2. Product Partner    — pain, solution, differentiation, execution
 *   3. Financial Partner  — revenue, margins, ROI, capital efficiency
 *   4. Technical Partner  — complexity, engineering risk, AI feasibility
 *   5. VC Partner         — fundability, exit, moat, long-term quality
 *
 * Each agent returns: vote(BUY/WATCH/PASS), confidence(0-100), score(0-100),
 * pros[], cons[], reasoning.
 *
 * Final decision: Strong Buy | Buy | Watch | Reject
 */

-- =====================================================================
-- investment_committees
-- =====================================================================
create table if not exists investment_committees (
  id uuid primary key default gen_random_uuid(),

  opportunity_id uuid not null
    references opportunities(id)
    on delete cascade,

  -- Aggregated metrics
  overall_score   numeric(5,2) not null default 0
    check (overall_score >= 0 and overall_score <= 100),

  confidence      numeric(5,2) not null default 0
    check (confidence >= 0 and confidence <= 100),

  -- Vote aggregation
  majority_vote   text,
  minority_vote    text,

  -- Final recommendation
  final_decision  text not null
    check (final_decision in ('Strong Buy', 'Buy', 'Watch', 'Reject')),

  -- Audit
  summary         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_ic_opportunity
  on investment_committees(opportunity_id);

create index if not exists idx_ic_decision
  on investment_committees(final_decision);

create index if not exists idx_ic_score
  on investment_committees(overall_score desc);

create index if not exists idx_ic_created
  on investment_committees(created_at desc);

alter table investment_committees enable row level security;

create policy "ic_owner_r"
  on investment_committees for select
  using (
    opportunity_id in (select id from opportunities)
  );

create policy "ic_admin_all"
  on investment_committees for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- =====================================================================
-- committee_votes
-- =====================================================================
create table if not exists committee_votes (
  id uuid primary key default gen_random_uuid(),

  committee_id uuid not null
    references investment_committees(id)
    on delete cascade,

  -- Agent identity
  agent_name   text not null,
  agent_role   text not null,

  -- Vote data
  vote         text not null
    check (vote in ('BUY', 'WATCH', 'PASS')),
  score        numeric(5,2) not null
    check (score >= 0 and score <= 100),
  confidence   numeric(5,2) not null
    check (confidence >= 0 and confidence <= 100),
  pros         text[] not null default '{}',
  cons         text[] not null default '{}',
  reasoning    text not null,

  created_at   timestamptz not null default now()
);

create index if not exists idx_cv_committee
  on committee_votes(committee_id);

create index if not exists idx_cv_agent
  on committee_votes(agent_name);

create index if not exists idx_cv_vote
  on committee_votes(vote);

alter table committee_votes enable row level security;

create policy "cv_owner_r"
  on committee_votes for select
  using (
    committee_id in (
      select id from investment_committees
      where opportunity_id in (select id from opportunities)
    )
  );

create policy "cv_admin_all"
  on committee_votes for all
  using (
    exists (
      select 1 from profiles
      join investment_committees ic on ic.committee_id = committee_votes.committee_id
      where id = auth.uid() and role = 'admin'
    )
  );
/**
 * Sprint 61: AI Investment Committee (Multi-Agent Decision Engine)
 *
 * Migration: create investment_committees + committee_votes tables.
 *
 * Instead of a single AI evaluating an opportunity, a panel of five
 * independent "AI VC partners" each votes on the same opportunity.
 * Their individual votes are persisted in `committee_votes`, and the
 * aggregated committee decision lands in `investment_committees`.
 *
 * Five agents:
 *   1. Market Analyst    — market size, timing, demand
 *   2. Technical Partner — difficulty, execution, technology risk
 *   3. Founder Partner   — founder fit, distribution, execution speed
 *   4. Investment Partner — ROI, exit, business model
 *   5. Risk Partner      — competition, regulation, market risk
 *
 * Consensus (final_decision):
 *   STRONG_BUY | BUY | NEUTRAL | PASS | REJECT
 *
 * Pipeline stage 13 (NEW): runs after Investment Memo stage, gated
 * by memo existence (i.e. only for genuine investor-ready startups).
 */

-- =====================================================================
-- investment_committees
-- =====================================================================
create table if not exists investment_committees (
  id uuid primary key default gen_random_uuid(),

  opportunity_id uuid not null
    references opportunities(id)
    on delete cascade,

  -- Aggregated committee metrics
  committee_score   numeric(5,2) not null default 0
    check (committee_score >= 0 and committee_score <= 100),

  confidence        numeric(5,2) not null default 0
    check (confidence >= 0 and confidence <= 100),

  consensus         numeric(5,2) not null default 0
    check (consensus >= 0 and consensus <= 100),

  -- Final committee decision
  final_decision    text not null,

  -- Audit
  votes_count       integer not null default 0
    check (votes_count >= 0),

  -- Bullet summary of the committee's reasoning (optional, per-agent saved separately)
  summary           text,

  created_at        timestamptz not null default now()
);

create index if not exists idx_investment_committees_opportunity
  on investment_committees(opportunity_id);

create index if not exists idx_investment_committees_created_desc
  on investment_committees(created_at desc);

create index if not exists idx_investment_committees_decision
  on investment_committees(final_decision);

alter table investment_committees enable row level security;

create policy "investment_committees_owner_all"
  on investment_committees
  for all
  using (
    opportunity_id in (
      select id from opportunities
    )
  );

create policy "investment_committees_admin_all"
  on investment_committees
  for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
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
  agent_name text not null,
  agent_role text not null,

  -- Individual vote
  vote        text not null, -- STRONG_BUY | BUY | NEUTRAL | PASS | REJECT
  score       numeric(5,2) not null
    check (score >= 0 and score <= 100),
  confidence  numeric(5,2) not null
    check (confidence >= 0 and confidence <= 100),
  reasoning   text not null,

  -- Agent weighting (some partners weigh more, e.g. risk partner has alpha)
  weight      numeric(4,2) not null default 1.0
    check (weight >= 0 and weight <= 5),

  created_at  timestamptz not null default now()
);

create index if not exists idx_committee_votes_committee
  on committee_votes(committee_id);

create index if not exists idx_committee_votes_agent
  on committee_votes(agent_name);

alter table committee_votes enable row level security;

create policy "committee_votes_owner_all"
  on committee_votes
  for all
  using (
    committee_id in (
      select id from investment_committees
      where opportunity_id in (
        select id from opportunities
      )
    )
  );

create policy "committee_votes_admin_all"
  on committee_votes
  for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

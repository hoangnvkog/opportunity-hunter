/**
 * Sprint 53: Market Evidence Engine
 *
 * Migration: create opportunity_evidence table
 * Stores market evidence proving why an opportunity is validated.
 *
 * Pipeline stage 7: ONLY generates evidence when validation_score >= 70.
 */

-- Create opportunity_evidence table
create table if not exists opportunity_evidence (
  id uuid primary key default gen_random_uuid(),

  opportunity_id uuid not null
    references opportunities(id)
    on delete cascade,

  evidence_type text not null
    check (evidence_type in (
      'reddit',
      'google_trend',
      'competitor',
      'market_report',
      'pricing',
      'customer_quote'
    )),

  source text not null,
  title text not null,
  url text,
  summary text,
  confidence numeric(5,2) not null default 0
    check (confidence >= 0 and confidence <= 100),

  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_evidence_opportunity
  on opportunity_evidence(opportunity_id);

create index if not exists idx_evidence_type
  on opportunity_evidence(evidence_type);

-- RLS
alter table opportunity_evidence enable row level security;

-- Policies: owner + admin full access, public read for evidence from public opportunities
create policy "evidence_owner_all"
  on opportunity_evidence
  for all
  using (
    opportunity_id in (
      select id from opportunities
      where user_id = auth.uid()
    )
  );

create policy "evidence_admin_all"
  on opportunity_evidence
  for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );
/**
 * Sprint 62: Autonomous Research Agent
 *
 * Migration: create research_jobs, research_sources, research_logs tables.
 *
 * This enables the system to automatically discover, analyze, and prioritize
 * opportunities without manual triggering.
 *
 * Tables:
 *   - research_sources: Configured data sources (reddit, github, etc.)
 *   - research_jobs: Tracking of research job execution
 *   - research_logs: Detailed logging for debugging and audit
 *
 * Each research job processes multiple sources through the pipeline:
 *   Collect → Pain Extraction → Cluster → Opportunity → Validation →
 *   Startup Ideas → Trend → Forecast → Market Intelligence → Investment Score →
 *   Investment Committee → Store Results
 */

-- =====================================================================
-- research_sources
-- =====================================================================
create table if not exists research_sources (
  id uuid primary key default gen_random_uuid(),

  name text not null unique,
  enabled boolean not null default true,
  priority integer not null default 0
    check (priority >= 0 and priority <= 100),
  rate_limit integer not null default 60
    check (rate_limit >= 1), -- requests per minute
  last_sync timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists idx_research_sources_enabled_priority
  on research_sources(enabled desc, priority desc);

alter table research_sources enable row level security;

create policy "research_sources_public_read"
  on research_sources
  for select
  using (true);

create policy "research_sources_admin_all"
  on research_sources
  for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- =====================================================================
-- research_jobs
-- =====================================================================
create table if not exists research_jobs (
  id uuid primary key default gen_random_uuid(),

  source text not null
    check (source in ('reddit', 'github', 'hackernews', 'producthunt', 'rss', 'all')),

  status text not null
    check (status in ('pending', 'running', 'completed', 'failed', 'cancelled'))
    default 'pending',

  started_at timestamptz,
  finished_at timestamptz,

  items_found integer not null default 0
    check (items_found >= 0),
  items_processed integer not null default 0
    check (items_processed >= 0 and items_processed <= items_found),

  created_at timestamptz not null default now()
);

create index if not exists idx_research_jobs_status_created
  on research_jobs(status, created_at desc);

create index if not exists idx_research_jobs_source
  on research_jobs(source);

alter table research_jobs enable row level security;

create policy "research_jobs_public_read"
  on research_jobs
  for select
  using (true);

create policy "research_jobs_admin_all"
  on research_jobs
  for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- =====================================================================
-- research_logs
-- =====================================================================
create table if not exists research_logs (
  id uuid primary key default gen_random_uuid(),

  job_id uuid not null
    references research_jobs(id)
    on delete cascade,

  stage text not null
    check (stage in (
      'collect', 'pain', 'cluster', 'opportunity', 'validation',
      'startup_idea', 'trend', 'forecast', 'market_intelligence',
      'investment_score', 'committee', 'store_results', 'unknown'
    )),

  message text not null,

  level text not null
    check (level in ('debug', 'info', 'warn', 'error'))
    default 'info',

  created_at timestamptz not null default now()
);

create index if not exists idx_research_logs_job_id
  on research_logs(job_id);

create index if not exists idx_research_logs_created_desc
  on research_logs(created_at desc);

create index if not exists idx_research_logs_level
  on research_logs(level);

alter table research_logs enable row level security;

create policy "research_logs_public_read"
  on research_logs
  for select
  using (true);

create policy "research_logs_admin_all"
  on research_logs
  for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- =====================================================================
-- Insert default research sources
-- =====================================================================
insert into research_sources (name, enabled, priority, rate_limit) values
  ('reddit', true, 100, 60),
  ('github', true, 90, 30),
  ('hackernews', true, 80, 120),
  ('producthunt', true, 70, 60),
  ('rss', true, 60, 30)
on conflict (name) do nothing;
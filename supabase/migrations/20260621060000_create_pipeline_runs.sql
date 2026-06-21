-- Create pipeline_runs table to track pipeline execution history
create table if not exists public.pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null,
  finished_at timestamptz not null,
  duration_ms integer not null,
  raw_posts integer not null,
  pain_points integer not null,
  clusters integer not null,
  opportunities integer not null,
  startup_ideas integer not null,
  status text not null check (status in ('success', 'failed')),
  created_at timestamptz default now()
);

-- Indexes for common queries
create index if not exists pipeline_runs_started_at_idx on public.pipeline_runs (started_at desc);
create index if not exists pipeline_runs_status_idx on public.pipeline_runs (status);

-- RLS policies
alter table public.pipeline_runs enable row level security;

-- Public read access for now (no auth yet)
create policy "Allow public read access"
  on public.pipeline_runs
  for select
  using (true);

-- Service role can insert/update
create policy "Allow service role insert"
  on public.pipeline_runs
  for insert
  with check (true);

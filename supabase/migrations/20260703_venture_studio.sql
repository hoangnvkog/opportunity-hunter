-- Sprint 63: AI Venture Studio Generator
-- Creates venture_projects, venture_canvas, venture_gtm, venture_mvp tables with RLS.

-- ============================================================================
-- Table: venture_projects
-- ============================================================================
create table if not exists venture_projects (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null,
  startup_idea_id uuid,
  name text not null,
  tagline text not null default '',
  status text not null default 'draft',
  overall_score numeric(6,3) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table venture_projects is 'Sprint 63: AI Venture Studio — complete startup blueprints';

alter table venture_projects
  add constraint venture_projects_opportunity_id_fkey
    foreign key (opportunity_id) references opportunities(id) on delete cascade;

alter table venture_projects
  add constraint venture_projects_startup_idea_id_fkey
    foreign key (startup_idea_id) references startup_ideas(id) on delete set null;

-- ============================================================================
-- Table: venture_canvas
-- ============================================================================
create table if not exists venture_canvas (
  id uuid primary key default gen_random_uuid(),
  venture_project_id uuid not null,
  problem text not null default '',
  solution text not null default '',
  value_proposition text not null default '',
  customer_segments text not null default '',
  channels text not null default '',
  customer_relationships text not null default '',
  key_activities text not null default '',
  key_resources text not null default '',
  key_partners text not null default '',
  cost_structure text not null default '',
  revenue_streams text not null default '',
  created_at timestamptz not null default now()
);

comment on table venture_canvas is 'Sprint 63: Business Model Canvas + Lean Canvas for a venture project';

alter table venture_canvas
  add constraint venture_canvas_venture_project_id_fkey
    foreign key (venture_project_id) references venture_projects(id) on delete cascade;

-- ============================================================================
-- Table: venture_gtm
-- ============================================================================
create table if not exists venture_gtm (
  id uuid primary key default gen_random_uuid(),
  venture_project_id uuid not null,
  launch_strategy text not null default '',
  acquisition_channels text not null default '',
  pricing_strategy text not null default '',
  growth_loops text not null default '',
  marketing_plan text not null default '',
  sales_plan text not null default '',
  created_at timestamptz not null default now()
);

comment on table venture_gtm is 'Sprint 63: Go-to-Market strategy for a venture project';

alter table venture_gtm
  add constraint venture_gtm_venture_project_id_fkey
    foreign key (venture_project_id) references venture_projects(id) on delete cascade;

-- ============================================================================
-- Table: venture_mvp
-- ============================================================================
create table if not exists venture_mvp (
  id uuid primary key default gen_random_uuid(),
  venture_project_id uuid not null,
  core_features text not null default '',
  roadmap text not null default '',
  tech_stack text not null default '',
  estimated_cost text not null default '',
  estimated_time text not null default '',
  risks text not null default '',
  created_at timestamptz not null default now()
);

comment on table venture_mvp is 'Sprint 63: MVP plan for a venture project';

alter table venture_mvp
  add constraint venture_mvp_venture_project_id_fkey
    foreign key (venture_project_id) references venture_projects(id) on delete cascade;

-- ============================================================================
-- updated_at trigger for venture_projects
-- ============================================================================
create or replace function update_venture_projects_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger venture_projects_updated_at
  before update on venture_projects
  for each row
  execute function update_venture_projects_updated_at();

-- ============================================================================
-- RLS policies
-- ============================================================================
alter table venture_projects enable row level security;
alter table venture_canvas enable row level security;
alter table venture_gtm enable row level security;
alter table venture_mvp enable row level security;

-- Allow all operations for authenticated users (same pattern as other tables)
create policy "Allow all for authenticated users" on venture_projects
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Allow all for authenticated users" on venture_canvas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Allow all for authenticated users" on venture_gtm
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Allow all for authenticated users" on venture_mvp
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Sprint 64: Financial Projection Engine
-- Tables: financial_models, financial_projections, unit_economics, break_even_analysis

-- ── Financial Models ──────────────────────────────────────────────────────────

create table financial_models (
  id uuid primary key default gen_random_uuid(),
  venture_project_id uuid not null references venture_projects(id) on delete cascade,
  currency text not null default 'USD',
  projection_years integer not null default 5,
  assumptions jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_financial_models_venture_project_id on financial_models(venture_project_id);

alter table financial_models enable row level security;

create policy "financial_models_select_auth" on financial_models
  for select using (auth.role() = 'authenticated');

create policy "financial_models_insert_auth" on financial_models
  for insert with check (auth.role() = 'authenticated');

create policy "financial_models_update_auth" on financial_models
  for update using (auth.role() = 'authenticated');

create policy "financial_models_delete_auth" on financial_models
  for delete using (auth.role() = 'authenticated');

-- ── Financial Projections ─────────────────────────────────────────────────────

create table financial_projections (
  id uuid primary key default gen_random_uuid(),
  financial_model_id uuid not null references financial_models(id) on delete cascade,
  year integer not null,
  revenue numeric not null default 0,
  cogs numeric not null default 0,
  gross_profit numeric not null default 0,
  operating_expenses numeric not null default 0,
  ebitda numeric not null default 0,
  net_profit numeric not null default 0,
  cash_balance numeric not null default 0,
  created_at timestamptz not null default now()
);

create index idx_financial_projections_financial_model_id on financial_projections(financial_model_id);

alter table financial_projections enable row level security;

create policy "financial_projections_select_auth" on financial_projections
  for select using (auth.role() = 'authenticated');

create policy "financial_projections_insert_auth" on financial_projections
  for insert with check (auth.role() = 'authenticated');

create policy "financial_projections_delete_auth" on financial_projections
  for delete using (auth.role() = 'authenticated');

-- ── Unit Economics ────────────────────────────────────────────────────────────

create table unit_economics (
  id uuid primary key default gen_random_uuid(),
  financial_model_id uuid not null references financial_models(id) on delete cascade,
  cac numeric not null default 0,
  ltv numeric not null default 0,
  ltv_cac_ratio numeric not null default 0,
  payback_months numeric not null default 0,
  gross_margin numeric not null default 0,
  arpu numeric not null default 0,
  monthly_churn numeric not null default 0,
  created_at timestamptz not null default now()
);

create index idx_unit_economics_financial_model_id on unit_economics(financial_model_id);

alter table unit_economics enable row level security;

create policy "unit_economics_select_auth" on unit_economics
  for select using (auth.role() = 'authenticated');

create policy "unit_economics_insert_auth" on unit_economics
  for insert with check (auth.role() = 'authenticated');

create policy "unit_economics_delete_auth" on unit_economics
  for delete using (auth.role() = 'authenticated');

-- ── Break-Even Analysis ──────────────────────────────────────────────────────

create table break_even_analysis (
  id uuid primary key default gen_random_uuid(),
  financial_model_id uuid not null references financial_models(id) on delete cascade,
  monthly_fixed_cost numeric not null default 0,
  gross_margin numeric not null default 0,
  break_even_revenue numeric not null default 0,
  break_even_customers integer not null default 0,
  estimated_break_even_month integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_break_even_analysis_financial_model_id on break_even_analysis(financial_model_id);

alter table break_even_analysis enable row level security;

create policy "break_even_analysis_select_auth" on break_even_analysis
  for select using (auth.role() = 'authenticated');

create policy "break_even_analysis_insert_auth" on break_even_analysis
  for insert with check (auth.role() = 'authenticated');

create policy "break_even_analysis_delete_auth" on break_even_analysis
  for delete using (auth.role() = 'authenticated');

-- ── Updated_at trigger for financial_models ───────────────────────────────────

create trigger update_financial_models_updated_at
  before update on financial_models
  for each row execute function update_updated_at_column();

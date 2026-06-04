-- ============================================================================
-- Seed: pain_clusters
-- Spec    : id, cluster_name, description (no created_at)
-- ============================================================================

insert into public.pain_clusters (id, cluster_name, description) values
  (
    '30000000-0000-0000-0000-000000000001',
    'SMB operations tooling',
    'Small teams (<10 people) glue together spreadsheets to run core ops and have no purpose-built alternative.'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    'B2B onboarding friction',
    'B2B SaaS companies waste PM hours on manual customer onboarding and kickoff workflows.'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    'Founder analytics blind spots',
    'Indie founders and small operators cannot see revenue, churn, and retention in one place.'
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    'Real-time retention signals',
    'Teams are not alerted the moment a customer churns or shows warning signs.'
  ),
  (
    '30000000-0000-0000-0000-000000000005',
    'Manual client reporting',
    'Agencies and service businesses spend hours each week formatting client reports by hand.'
  ),
  (
    '30000000-0000-0000-0000-000000000006',
    'Lightweight team productivity',
    'Small teams find existing project management tools too bloated; want simple, focused tools.'
  )
on conflict (id) do nothing;

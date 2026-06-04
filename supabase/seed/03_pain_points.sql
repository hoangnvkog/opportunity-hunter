-- ============================================================================
-- Seed: pain_points
-- Spec    : severity, buying_intent in [0, 1]
-- ============================================================================

insert into public.pain_points (
  id, raw_post_id, pain, category, severity, buying_intent
) values
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Operations teams under 10 people rely on Google Sheets to run critical workflows.',
    'operations',
    0.820,
    0.610
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'Manual B2B onboarding takes 2 weeks and consumes product management hours.',
    'onboarding',
    0.760,
    0.700
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003',
    'Indie founders lack a single pane of glass for churn and revenue metrics.',
    'analytics',
    0.680,
    0.550
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000004',
    'Founders are not notified in real time when a customer churns.',
    'retention',
    0.740,
    0.640
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000005',
    'Agency owners spend half the week manually building client reports.',
    'reporting',
    0.790,
    0.670
  ),
  (
    '20000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000006',
    'Small teams find existing project management tools bloated and overpriced.',
    'productivity',
    0.710,
    0.590
  )
on conflict (id) do nothing;

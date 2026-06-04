-- ============================================================================
-- Seed: startup_ideas
-- Spec    : opportunity_id, problem, solution, mvp, pricing (no
--           target_customer, no created_at)
-- ============================================================================

insert into public.startup_ideas (
  id, opportunity_id, problem, solution, mvp, pricing
) values
  (
    '50000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'Sub-10 person ops teams duct-tape Google Sheets to run core workflows.',
    'A focused ops workspace with pre-built playbooks for finance, hiring, and vendor management.',
    'Single workspace with 3 templates: weekly close, vendor review, hiring loop.',
    '$29 / user / month, billed annually.'
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000002',
    'B2B onboarding takes 2 weeks of PM time per new customer.',
    'Automated onboarding flows with checklists, in-app guides, and PM dashboards.',
    'Templates, in-app guide builder, and a "kickoff in <1 day" SLA dashboard.',
    '$199 / month per workspace.'
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '40000000-0000-0000-0000-000000000003',
    'Indie founders have no single view of revenue and churn.',
    'Stitch Mixpanel + Stripe into a "founder cockpit" with daily digest.',
    'OAuth integrations with Stripe and one analytics source, plus a daily email digest.',
    '$19 / month, free under $10k MRR.'
  ),
  (
    '50000000-0000-0000-0000-000000000004',
    '40000000-0000-0000-0000-000000000004',
    'Founders discover churn days or weeks after it happens.',
    'Real-time Slack alerts on churn signals (failed payments, NPS drops, inactivity).',
    'Stripe webhook listener + Slack alert rules, configurable per workspace.',
    '$39 / month per workspace.'
  ),
  (
    '50000000-0000-0000-0000-000000000005',
    '40000000-0000-0000-0000-000000000005',
    'Agencies burn half the week formatting client reports.',
    'White-labeled report builder that pulls from common data sources and sends on schedule.',
    'Drag-and-drop report builder + scheduled email delivery + white-label PDFs.',
    '$79 / month per agency, $5 / month per client.'
  ),
  (
    '50000000-0000-0000-0000-000000000006',
    '40000000-0000-0000-0000-000000000006',
    'Small teams find project management apps bloated and overpriced.',
    'A minimal kanban + calendar app with a fixed low price, no per-user fees.',
    'Single workspace kanban with calendar overlay, no SSO/permissions overhead.',
    '$15 / month flat for the whole team.'
  )
on conflict (id) do nothing;

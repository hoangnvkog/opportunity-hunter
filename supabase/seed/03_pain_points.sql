-- ============================================================================
-- Seed: 03_pain_points.sql
-- Purpose: Insert demo pain points extracted from raw posts
-- ============================================================================

insert into public.pain_points (id, raw_post_id, pain, category, severity, buying_intent, created_at) values
  -- Pain points from manual onboarding post
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Manual customer onboarding requires 3-4 hours per customer', 'Productivity', 0.850, 0.900, now() - interval '5 days'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
   'Cannot scale SaaS business due to manual processes', 'Productivity', 0.900, 0.850, now() - interval '5 days'),

  -- Pain points from customer support post
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002',
   'Small team overwhelmed by 50-70 daily support tickets', 'Customer Service', 0.920, 0.880, now() - interval '3 days'),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002',
   'Repetitive support questions waste team time', 'AI', 0.880, 0.920, now() - interval '3 days'),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002',
   '24+ hour response time causing customer churn', 'Customer Service', 0.950, 0.900, now() - interval '3 days'),

  -- Pain points from failed payments post
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003',
   'Losing $2-3k monthly to failed credit card payments', 'Finance', 0.870, 0.910, now() - interval '7 days'),
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000003',
   'Customers ignore payment reminder emails', 'Marketing', 0.750, 0.800, now() - interval '7 days'),

  -- Pain points from complex analytics post
  ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000004',
   'Analytics dashboard too complex for non-technical users', 'Productivity', 0.820, 0.850, now() - interval '2 days'),
  ('c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000004',
   'Customers want simple insights without navigating 20 charts', 'Productivity', 0.800, 0.870, now() - interval '2 days'),

  -- Pain points from content marketing post
  ('c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000005',
   'Spending 10+ hours weekly on content with no traffic growth', 'Marketing', 0.900, 0.880, now() - interval '1 day'),
  ('c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000005',
   'Organic traffic flat at 500 visits/month despite effort', 'Marketing', 0.850, 0.900, now() - interval '1 day'),

  -- Pain points from pitch deck post
  ('c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000006',
   'Financial projections in spreadsheets are breaking', 'Finance', 0.780, 0.820, now() - interval '4 days'),
  ('c0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000006',
   'Cannot model different financial scenarios easily', 'Finance', 0.800, 0.850, now() - interval '4 days'),

  -- Pain points from solo founder post
  ('c0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000007',
   'Non-technical founder drowning in code reviews and deployments', 'Productivity', 0.890, 0.870, now() - interval '6 days'),
  ('c0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000007',
   'Need project management tools for non-technical founders', 'Productivity', 0.860, 0.890, now() - interval '6 days'),

  -- Pain points from customer interviews post
  ('c0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000008',
   'Customer interview notes scattered across multiple tools', 'Productivity', 0.840, 0.860, now() - interval '3 days'),
  ('c0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000008',
   'Hard to spot patterns in customer feedback', 'AI', 0.820, 0.880, now() - interval '3 days'),

  -- Pain points from bookkeeping post
  ('c0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000009',
   'Manual bookkeeping reconciliation across multiple payment processors', 'Finance', 0.910, 0.930, now() - interval '2 days'),
  ('c0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000009',
   'Accountant takes 3 weeks to close books monthly', 'Finance', 0.880, 0.900, now() - interval '2 days'),

  -- Pain points from hiring post
  ('c0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000010',
   'Hiring process is ad-hoc using emails and spreadsheets', 'Productivity', 0.830, 0.850, now() - interval '5 days'),
  ('c0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000010',
   'New remote hires take 3 months to become productive', 'Productivity', 0.870, 0.890, now() - interval '5 days'),

  -- Pain points from legal compliance post
  ('c0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000011',
   'Overwhelmed by GDPR, CCPA, SOC2 compliance requirements', 'Finance', 0.860, 0.880, now() - interval '1 day'),
  ('c0000000-0000-0000-0000-000000000023', 'b0000000-0000-0000-0000-000000000011',
   'Lawyers charge $500/hour for compliance guidance', 'Finance', 0.840, 0.860, now() - interval '1 day'),

  -- Pain points from inventory post
  ('c0000000-0000-0000-0000-000000000024', 'b0000000-0000-0000-0000-000000000012',
   'Cannot predict demand accurately for 200 SKUs', 'Ecommerce', 0.930, 0.950, now() - interval '4 days'),
  ('c0000000-0000-0000-0000-000000000025', 'b0000000-0000-0000-0000-000000000012',
   'Overstocking ties up cash, stockouts lose sales', 'Ecommerce', 0.940, 0.920, now() - interval '4 days'),

  -- Pain points from API docs post
  ('c0000000-0000-0000-0000-000000000026', 'b0000000-0000-0000-0000-000000000013',
   'Manually writing API docs that get outdated', 'Productivity', 0.850, 0.870, now() - interval '2 days'),
  ('c0000000-0000-0000-0000-000000000027', 'b0000000-0000-0000-0000-000000000013',
   'Keeping documentation in sync with code is difficult', 'Productivity', 0.830, 0.850, now() - interval '2 days'),

  -- Pain points from sales pipeline post
  ('c0000000-0000-0000-0000-000000000028', 'b0000000-0000-0000-0000-000000000014',
   'B2B sales CRMs are clunky for small startups', 'Productivity', 0.880, 0.900, now() - interval '1 day'),
  ('c0000000-0000-0000-0000-000000000029', 'b0000000-0000-0000-0000-000000000014',
   'Too much manual data entry in sales tools', 'AI', 0.900, 0.880, now() - interval '1 day'),

  -- Pain points from developer onboarding post
  ('c0000000-0000-0000-0000-000000000030', 'b0000000-0000-0000-0000-000000000015',
   'New developers take too long to ramp up', 'Productivity', 0.870, 0.890, now() - interval '3 days'),
  ('c0000000-0000-0000-0000-000000000031', 'b0000000-0000-0000-0000-000000000015',
   'Minimal documentation and tribal knowledge in codebases', 'Productivity', 0.850, 0.870, now() - interval '3 days'),

  -- Pain points from code review post
  ('c0000000-0000-0000-0000-000000000032', 'b0000000-0000-0000-0000-000000000016',
   'AI code review tools miss architectural issues', 'AI', 0.810, 0.830, now() - interval '5 days'),
  ('c0000000-0000-0000-0000-000000000033', 'b0000000-0000-0000-0000-000000000016',
   'Still need human reviewers for important PRs', 'Productivity', 0.790, 0.810, now() - interval '5 days'),

  -- Pain points from Intercom alternative post
  ('c0000000-0000-0000-0000-000000000034', 'b0000000-0000-0000-0000-000000000017',
   'Customer messaging platforms are expensive for B2B SaaS', 'Customer Service', 0.820, 0.840, now() - interval '4 days'),

  -- Pain points from churn prediction post
  ('c0000000-0000-0000-0000-000000000035', 'b0000000-0000-0000-0000-000000000023',
   'Losing 8% monthly churn without prediction', 'Customer Service', 0.920, 0.940, now() - interval '2 days'),
  ('c0000000-0000-0000-0000-000000000036', 'b0000000-0000-0000-0000-000000000023',
   'Customer data scattered across Mixpanel, Intercom, Stripe', 'Productivity', 0.880, 0.900, now() - interval '2 days'),

  -- Pain points from pricing tests post
  ('c0000000-0000-0000-0000-000000000037', 'b0000000-0000-0000-0000-000000000024',
   'Pricing experiments are slow and risky', 'Marketing', 0.760, 0.780, now() - interval '5 days'),
  ('c0000000-0000-0000-0000-000000000038', 'b0000000-0000-0000-0000-000000000024',
   'Manual analysis of pricing changes takes 2 weeks', 'Finance', 0.800, 0.820, now() - interval '5 days'),

  -- Pain points from contractors post
  ('c0000000-0000-0000-0000-000000000039', 'b0000000-0000-0000-0000-000000000025',
   'Managing contractors across 5 countries with multiple tools', 'Productivity', 0.850, 0.870, now() - interval '3 days'),
  ('c0000000-0000-0000-0000-000000000040', 'b0000000-0000-0000-0000-000000000025',
   'No unified platform for global contractor management', 'Productivity', 0.870, 0.890, now() - interval '3 days');

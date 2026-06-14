-- ============================================================================
-- Seed: 04_pain_clusters.sql
-- Purpose: Insert demo pain clusters grouping related pain points
-- ============================================================================

insert into public.pain_clusters (id, cluster_name, description) values
  ('d0000000-0000-0000-0000-000000000001', 'Manual Onboarding & Setup',
   'Pain points related to time-consuming manual customer onboarding, account setup, and initial configuration that doesn''t scale'),

  ('d0000000-0000-0000-0000-000000000002', 'Customer Support Overload',
   'Pain points about being overwhelmed by support tickets, repetitive questions, slow response times, and customer churn'),

  ('d0000000-0000-0000-0000-000000000003', 'Financial Management & Payments',
   'Pain points related to failed payments, bookkeeping, financial projections, compliance costs, and payment reconciliation'),

  ('d0000000-0000-0000-0000-000000000004', 'Complex Analytics & Reporting',
   'Pain points about overly complex dashboards, difficulty getting simple insights, and data scattered across multiple tools'),

  ('d0000000-0000-0000-0000-000000000005', 'Content Marketing Inefficiency',
   'Pain points about spending too much time on content creation with poor results, flat traffic, and ineffective marketing strategies'),

  ('d0000000-0000-0000-0000-000000000006', 'Development Workflow & Documentation',
   'Pain points related to code reviews, API documentation, developer onboarding, and managing technical workflows'),

  ('d0000000-0000-0000-0000-000000000007', 'Sales Pipeline Management',
   'Pain points about clunky CRM tools, manual data entry, and inefficient sales processes for B2B startups'),

  ('d0000000-0000-0000-0000-000000000008', 'HR & Remote Team Management',
   'Pain points related to hiring, onboarding employees, managing contractors across timezones, and HR processes'),

  ('d0000000-0000-0000-0000-000000000009', 'E-commerce Operations',
   'Pain points about inventory forecasting, demand prediction, stockouts, overstocking, and e-commerce operational challenges'),

  ('d0000000-0000-0000-0000-000000000010', 'Customer Retention & Churn',
   'Pain points related to customer churn, retention strategies, pricing experiments, and identifying at-risk customers');

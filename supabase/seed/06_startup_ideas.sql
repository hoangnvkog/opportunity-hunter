-- ============================================================================
-- Seed: 06_startup_ideas.sql
-- Purpose: Insert demo startup ideas derived from opportunities
-- ============================================================================

insert into public.startup_ideas (id, opportunity_id, problem, solution, mvp, pricing) values
  ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
   'SaaS companies spend 3-4 hours manually onboarding each customer, preventing scale',
   'Self-service onboarding platform with interactive walkthroughs, automated account setup, and progress tracking',
   'Browser extension that records onboarding flows and converts them into interactive guides with analytics',
   'Freemium: $49/mo for 100 users, $149/mo for 1000 users, Enterprise custom pricing'),

  ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002',
   'Small support teams are drowning in repetitive tickets, leading to slow response times and churn',
   'AI-powered support assistant that auto-answers common questions, suggests responses, and escalates complex issues',
   'Chatbot widget trained on existing support docs and past tickets, with human handoff workflow',
   '$99/mo for 500 tickets, $249/mo for 2000 tickets, includes AI training and analytics'),

  ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003',
   'Startups lose revenue to failed payments and struggle with manual bookkeeping across multiple processors',
   'Automated payment recovery and bookkeeping platform that reconciles transactions and handles dunning',
   'Stripe/Plaid integration that auto-retries failed payments, sends smart reminders, and exports to accounting software',
   '$79/mo + 1% of recovered revenue, or $199/mo flat for high-volume merchants'),

  ('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000004',
   'Non-technical users find analytics dashboards too complex and can''t get simple insights',
   'AI-powered analytics assistant that answers business questions in plain English and generates simple reports',
   'Chat interface connected to existing data sources (Mixpanel, GA, Stripe) that answers questions like "What''s my MRR this month?"',
   '$49/mo for 3 data sources, $149/mo for unlimited sources, includes custom report builder'),

  ('f0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000006',
   'Developer teams waste hours on manual documentation, code reviews, and onboarding new engineers',
   'AI documentation and code review platform that auto-generates docs, catches issues, and accelerates onboarding',
   'GitHub integration that auto-generates API docs from code, suggests code review comments, and creates onboarding guides',
   '$99/mo per repo for small teams, $299/mo for unlimited repos, includes AI training on your codebase'),

  ('f0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000007',
   'B2B sales teams struggle with clunky CRMs that require too much manual data entry',
   'AI-powered CRM that auto-captures sales activities from email/calendar and provides actionable insights',
   'Email/Calendar integration that auto-logs meetings, calls, and follow-ups, with AI-generated deal insights',
   '$39/user/mo for up to 10 users, $29/user/mo for 10+ users, includes AI assistant and forecasting'),

  ('f0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000008',
   'Remote teams struggle with chaotic hiring processes and slow employee onboarding',
   'All-in-one HR platform for remote teams with hiring workflows, automated onboarding, and contractor management',
   'Applicant tracking + onboarding checklists + document management with integrations to Slack, DocuSign, and payroll',
   '$8/employee/mo for core HR, $15/employee/mo for full suite including performance and time tracking'),

  ('f0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000009',
   'E-commerce businesses can''t predict demand accurately, leading to stockouts and overstocking',
   'AI-powered inventory forecasting platform that predicts demand and optimizes stock levels automatically',
   'Shopify/WooCommerce integration that analyzes sales history and generates purchase orders with confidence intervals',
   '$99/mo for up to 500 SKUs, $249/mo for 2000 SKUs, includes demand forecasting and reorder alerts'),

  ('f0000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000010',
   'SaaS companies lose 8% monthly churn but can''t identify at-risk customers in time',
   'Customer health scoring platform that predicts churn and triggers retention campaigns automatically',
   'Integration with product analytics and support tools that scores customer health and sends automated retention emails',
   '$149/mo for up to 1000 customers, $399/mo for 5000 customers, includes AI predictions and campaign automation'),

  ('f0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000005',
   'Founders spend 10+ hours weekly on content marketing with poor traffic results',
   'AI content marketing platform that generates SEO-optimized content and automates distribution',
   'Content generator trained on your brand voice + SEO tools + social media scheduler with performance analytics',
   '$79/mo for 20 articles, $199/mo for unlimited content, includes SEO optimization and distribution automation');

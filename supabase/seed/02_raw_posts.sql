-- ============================================================================
-- Seed: 02_raw_posts.sql
-- Purpose: Insert demo raw posts from various sources
-- ============================================================================

insert into public.raw_posts (id, source, title, content, url, score, created_at) values
  -- Reddit r/SaaS posts
  ('b0000000-0000-0000-0000-000000000001', 'Reddit - r/SaaS', 
   'Manual onboarding is killing my SaaS growth',
   'I''ve been running my B2B SaaS for 18 months and we''re stuck at 50 customers. The problem? Every new customer requires 3-4 hours of manual onboarding. I personally do Zoom calls, set up their accounts, import their data, and train their team. This doesn''t scale. I need to automate this but don''t know where to start. Has anyone built a self-service onboarding flow?',
   'https://reddit.com/r/SaaS/comments/manual-onboarding', 87, now() - interval '5 days'),

  ('b0000000-0000-0000-0000-000000000002', 'Reddit - r/SaaS',
   'Customer support tickets are drowning my small team',
   'We''re a 3-person team supporting 200 customers. We get 50-70 support tickets daily, mostly repetitive questions about password resets, billing, and basic feature usage. We''re using Zendesk but it''s expensive and we still can''t keep up. Response time is 24+ hours and customers are churning. Looking for AI-powered solutions or better workflows.',
   'https://reddit.com/r/SaaS/comments/support-tickets', 92, now() - interval '3 days'),

  ('b0000000-0000-0000-0000-000000000003', 'Reddit - r/SaaS',
   'How do you handle failed payments and dunning?',
   'Our MRR is $15k but we''re losing $2-3k monthly to failed credit card payments. We send reminder emails but customers ignore them. Stripe''s automatic retries help but aren''t enough. Need a better dunning strategy. What tools or processes do you use to recover failed payments?',
   'https://reddit.com/r/SaaS/comments/failed-payments', 78, now() - interval '7 days'),

  ('b0000000-0000-0000-0000-000000000004', 'Reddit - r/SaaS',
   'Analytics dashboard too complex for non-technical users',
   'Built a comprehensive analytics dashboard for our SaaS but customers complain it''s too complicated. They want simple insights like "how many new users this week" or "revenue trend" without navigating 20 different charts. Looking for ways to simplify or add AI-powered natural language queries.',
   'https://reddit.com/r/SaaS/comments/complex-analytics', 81, now() - interval '2 days'),

  -- Reddit r/startups posts
  ('b0000000-0000-0000-0000-000000000005', 'Reddit - r/startups',
   'Spending 10 hours/week on content marketing with no results',
   'I write 2 blog posts per week, create social media content, and do SEO research. That''s 10+ hours weekly but organic traffic is flat at 500 visits/month. Feels like I''m wasting time. Should I outsource to an agency, use AI tools, or just give up on content? What''s actually working for B2B startups in 2026?',
   'https://reddit.com/r/startups/comments/content-marketing', 95, now() - interval '1 day'),

  ('b0000000-0000-0000-0000-000000000006', 'Reddit - r/startups',
   'Investor pitch deck feedback - struggling with financial projections',
   'Building pitch deck for seed round. Have product, traction (50 customers, $10k MRR), but financial projections are a mess. Spreadsheets are breaking, can''t model different scenarios easily. Investors want 3-year projections with cohort analysis. Any tools that make this easier for non-finance founders?',
   'https://reddit.com/r/startups/comments/pitch-deck', 73, now() - interval '4 days'),

  ('b0000000-0000-0000-0000-000000000007', 'Reddit - r/startups',
   'Co-founder left, now I''m doing everything alone',
   'My technical co-founder quit 2 months ago. I''m non-technical (marketing background) and now managing 2 freelance developers. Code reviews, deployments, bug triage - I''m drowning. Need better project management and development workflow tools designed for non-technical founders.',
   'https://reddit.com/r/startups/comments/solo-founder', 88, now() - interval '6 days'),

  ('b0000000-0000-0000-0000-000000000008', 'Reddit - r/startups',
   'Customer interviews are inconsistent and time-consuming',
   'Doing 5 customer interviews per week but notes are scattered across Google Docs, Notion, and voice memos. Hard to spot patterns or share insights with team. Need a systematic way to conduct, record, and analyze customer interviews. What do you use?',
   'https://reddit.com/r/startups/comments/customer-interviews', 84, now() - interval '3 days'),

  -- Reddit r/Entrepreneur posts
  ('b0000000-0000-0000-0000-000000000009', 'Reddit - r/Entrepreneur',
   'Bookkeeping is a nightmare for my e-commerce business',
   'Running Shopify store with $50k monthly revenue. Bookkeeping is manual hell - reconciling Stripe, PayPal, Shopify Payments, inventory costs, shipping, returns. Accountant charges $800/month and still takes 3 weeks to close books. Looking for automated bookkeeping that integrates with e-commerce platforms.',
   'https://reddit.com/r/Entrepreneur/comments/bookkeeping', 91, now() - interval '2 days'),

  ('b0000000-0000-0000-0000-000000000010', 'Reddit - r/Entrepreneur',
   'Hiring and onboarding remote employees is chaotic',
   'Growing from 5 to 15 employees, all remote. Hiring process is ad-hoc (emails, spreadsheets), onboarding is just "figure it out", and we have no employee handbook. New hires take 3 months to become productive. Need HR/recruiting tools for small remote teams.',
   'https://reddit.com/r/Entrepreneur/comments/hiring', 79, now() - interval '5 days'),

  ('b0000000-0000-0000-0000-000000000011', 'Reddit - r/Entrepreneur',
   'Legal compliance for SaaS is confusing and expensive',
   'Launching SaaS in US and EU. GDPR, CCPA, SOC2, terms of service, privacy policy - overwhelmed by compliance requirements. Lawyers charge $500/hour and I don''t even know what I need. Looking for affordable compliance automation or templates.',
   'https://reddit.com/r/Entrepreneur/comments/legal-compliance', 86, now() - interval '1 day'),

  ('b0000000-0000-0000-0000-000000000012', 'Reddit - r/Entrepreneur',
   'Inventory forecasting is impossible with current tools',
   'E-commerce business with 200 SKUs. Can''t predict demand accurately - either overstock (tying up cash) or stockouts (losing sales). Using basic Shopify inventory management but it''s not smart enough. Need AI-powered demand forecasting for small e-commerce.',
   'https://reddit.com/r/Entrepreneur/comments/inventory', 94, now() - interval '4 days'),

  -- Hacker News posts
  ('b0000000-0000-0000-0000-000000000013', 'Hacker News',
   'Show HN: I built a tool to automate API documentation',
   'Tired of manually writing API docs that get outdated. Built a tool that auto-generates OpenAPI specs from code and keeps docs in sync. Uses AST parsing and AI to write descriptions. Looking for beta testers.',
   'https://news.ycombinator.com/item?id=12345678', 156, now() - interval '2 days'),

  ('b0000000-0000-0000-0000-000000000014', 'Hacker News',
   'Why is B2B sales pipeline management still broken?',
   'Used Salesforce, HubSpot, Pipedrive - all feel clunky for small B2B startups (10-50 employees). Too many fields, too much manual data entry, poor integration with email/calendar. Sales reps hate updating CRM. Is there a better way?',
   'https://news.ycombinator.com/item?id=23456789', 203, now() - interval '1 day'),

  ('b0000000-0000-0000-0000-000000000015', 'Hacker News',
   'Ask HN: Best practices for developer onboarding?',
   'Joining a startup as 5th engineer. Codebase is 3 years old, minimal documentation, tribal knowledge. Senior engineers are busy shipping features, can''t mentor. What tools/processes help new devs ramp up faster?',
   'https://news.ycombinator.com/item?id=34567890', 178, now() - interval '3 days'),

  ('b0000000-0000-0000-0000-000000000016', 'Hacker News',
   'The state of AI-powered code review in 2026',
   'Tried GitHub Copilot, CodeRabbit, PR-Agent for automated code reviews. They catch obvious bugs but miss architectural issues and business logic problems. Still need human reviewers for important PRs. What''s your experience?',
   'https://news.ycombinator.com/item?id=45678901', 189, now() - interval '5 days'),

  ('b0000000-0000-0000-0000-000000000017', 'Hacker News',
   'Show HN: Open-source alternative to Intercom for developer tools',
   'Built a lightweight customer messaging platform focused on developer tools. In-app chat, knowledge base, and AI-powered suggested answers. Self-hosted, GDPR-compliant. Looking for feedback from B2B SaaS founders.',
   'https://news.ycombinator.com/item?id=56789012', 167, now() - interval '4 days'),

  -- Product Hunt posts
  ('b0000000-0000-0000-0000-000000000018', 'Product Hunt',
   'Notion AI - Your connected workspace with AI superpowers',
   'Notion just launched AI features - writing assistance, summarization, Q&A across your workspace. But is it actually useful or just a gimmick? Early reviews are mixed. Some say it''s game-changing for documentation, others say it hallucinates too much.',
   'https://producthunt.com/posts/notion-ai', 245, now() - interval '1 day'),

  ('b0000000-0000-0000-0000-000000000019', 'Product Hunt',
   'Linear - The issue tracking tool you''ll enjoy using',
   'Linear claims to be faster and more beautiful than Jira. Developers love it but PMs complain about missing features (roadmaps, custom fields, reporting). Can a dev-focused tool work for the whole team?',
   'https://producthunt.com/posts/linear', 198, now() - interval '3 days'),

  ('b0000000-0000-0000-0000-000000000020', 'Product Hunt',
   'Framer - Build sites with AI, no code required',
   'Framer''s AI site builder lets you describe what you want and generates a complete website. Impressive demos but users report limited customization and poor SEO. Is AI-generated web design ready for production?',
   'https://producthunt.com/posts/framer-ai', 212, now() - interval '2 days'),

  ('b0000000-0000-0000-0000-000000000021', 'Product Hunt',
   'Raycast - Blazingly fast launcher for Mac',
   'Raycast replaced Spotlight for many power users. Extensions ecosystem is growing but some complain it''s becoming bloated. Recent AI features (translate, summarize) are useful but raise privacy concerns.',
   'https://producthunt.com/posts/raycast', 176, now() - interval '6 days'),

  ('b0000000-0000-0000-0000-000000000022', 'Product Hunt',
   'Superhuman - Email client for speed',
   'Superhuman charges $30/month for a fast email client. Users love keyboard shortcuts and speed but question the price. Recent AI features (write, summarize, schedule) compete with free alternatives. Is premium email worth it?',
   'https://producthunt.com/posts/superhuman', 154, now() - interval '4 days'),

  -- Additional diverse posts
  ('b0000000-0000-0000-0000-000000000023', 'Reddit - r/SaaS',
   'Churn prediction is impossible with our current data',
   'Losing 8% monthly churn but can''t predict which customers will leave. Usage data is in Mixpanel, support tickets in Intercom, billing in Stripe - no unified view. Need a way to identify at-risk customers before they cancel.',
   'https://reddit.com/r/SaaS/comments/churn-prediction', 89, now() - interval '2 days'),

  ('b0000000-0000-0000-0000-000000000024', 'Reddit - r/startups',
   'Pricing experiments are too slow and risky',
   'Want to test different pricing tiers but afraid of confusing customers or losing revenue. Current process: change pricing page, wait 2 weeks, analyze manually. Need a way to A/B test pricing safely with proper statistical analysis.',
   'https://reddit.com/r/startups/comments/pricing-tests', 76, now() - interval '5 days'),

  ('b0000000-0000-0000-0000-000000000025', 'Reddit - r/Entrepreneur',
   'Managing contractors across timezones is a mess',
   'Working with 8 contractors in 5 countries. Payments through Wise, contracts through DocuSign, communication through Slack, tasks through Asana. Nothing integrates well. Need a unified platform for global contractor management.',
   'https://reddit.com/r/Entrepreneur/comments/contractors', 82, now() - interval '3 days');

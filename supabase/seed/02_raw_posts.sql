-- ============================================================================
-- Seed: raw_posts
-- Spec    : source is a string (source name), not a FK
-- ============================================================================

insert into public.raw_posts (
  id, source, title, content, url, score
) values
  (
    '10000000-0000-0000-0000-000000000001',
    'r/SaaS',
    'Spreadsheet fatigue is killing my small ops team',
    'We keep duct-taping Google Sheets to run ops. There has to be a purpose-built tool for sub-10 person teams.',
    'https://www.reddit.com/r/SaaS/comments/saas_001',
    187
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'r/SaaS',
    'Onboarding new SaaS users takes us 2 weeks manually',
    'Every new B2B customer needs a hand-held kickoff. We are burning PM hours.',
    'https://www.reddit.com/r/SaaS/comments/saas_002',
    94
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'Hacker News',
    'Show HN: I built a tiny churn dashboard for indie founders',
    'Wrote it for myself, would have paid for it. Mostly just stitch Mixpanel + Stripe into one screen.',
    'https://news.ycombinator.com/item?id=hn_001',
    412
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'Indie Hackers',
    'Wish there was a tool that pings me the moment a customer churns',
    'Even a basic Slack alert would beat reading Stripe dashboards.',
    'https://www.indiehackers.com/post/ih_001',
    56
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    'r/Entrepreneur',
    'Reporting for clients eats half my week',
    'Pulling data, formatting decks, sending emails. There must be a better way.',
    'https://www.reddit.com/r/Entrepreneur/comments/ent_001',
    128
  ),
  (
    '10000000-0000-0000-0000-000000000006',
    'App Store Reviews',
    'Every project management app I try is overkill for a 3-person team',
    'I just need a simple kanban and a calendar. Why is everything 50 features?',
    'https://apps.apple.com/app/pm-overkill-reviews/id000000001',
    89
  )
on conflict (id) do nothing;

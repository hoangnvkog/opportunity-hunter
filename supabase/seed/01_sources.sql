-- ============================================================================
-- Seed: sources
-- ============================================================================

insert into public.sources (id, name, type, url) values
  ('00000000-0000-0000-0000-000000000001', 'r/SaaS',        'reddit',     'https://www.reddit.com/r/SaaS/'),
  ('00000000-0000-0000-0000-000000000002', 'r/Entrepreneur','reddit',     'https://www.reddit.com/r/Entrepreneur/'),
  ('00000000-0000-0000-0000-000000000003', 'Hacker News',   'forum',      'https://news.ycombinator.com/'),
  ('00000000-0000-0000-0000-000000000004', 'Indie Hackers', 'forum',      'https://www.indiehackers.com/'),
  ('00000000-0000-0000-0000-000000000005', 'App Store Reviews', 'app_review', 'https://www.apple.com/app-store/')
on conflict (id) do nothing;

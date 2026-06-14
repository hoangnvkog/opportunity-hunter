-- ============================================================================
-- Seed: 01_sources.sql
-- Purpose: Insert demo sources for raw post collection
-- Note: Tables are already truncated by 00_reset.sql
-- ============================================================================

-- Insert sources
insert into public.sources (id, name, type, url) values
  ('a0000000-0000-0000-0000-000000000001', 'Reddit - r/SaaS', 'reddit', 'https://reddit.com/r/SaaS'),
  ('a0000000-0000-0000-0000-000000000002', 'Reddit - r/startups', 'reddit', 'https://reddit.com/r/startups'),
  ('a0000000-0000-0000-0000-000000000003', 'Reddit - r/Entrepreneur', 'reddit', 'https://reddit.com/r/Entrepreneur'),
  ('a0000000-0000-0000-0000-000000000004', 'Hacker News', 'hackernews', 'https://news.ycombinator.com'),
  ('a0000000-0000-0000-0000-000000000005', 'Product Hunt', 'producthunt', 'https://producthunt.com');

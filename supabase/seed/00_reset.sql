-- ============================================================================
-- Seed reset: truncate every Opportunity Hunter table in dependency order.
-- ============================================================================

begin;

truncate table
  public.startup_ideas,
  public.opportunities,
  public.pain_clusters,
  public.pain_points,
  public.raw_posts,
  public.sources
restart identity cascade;

commit;

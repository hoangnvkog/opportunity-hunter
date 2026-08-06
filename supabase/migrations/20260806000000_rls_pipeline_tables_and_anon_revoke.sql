-- ============================================================================
-- Migration: 20260806000000_rls_pipeline_tables_and_anon_revoke.sql
-- Purpose : Sprint 70 H1 — apply RLS audit from Sprint 68 + revoke anon defaults.
--
-- Sprint 68 H1 (initial audit):
--   * `opportunities`     had only service_role policy → authenticated read blocked
--   * `raw_posts`         had only service_role policy → authenticated read blocked
--   * `pain_points`       had only service_role policy → authenticated read blocked
--   * `pain_clusters`     had only service_role policy → authenticated read blocked
--   * `pain_point_embeddings` granted authenticated INSERT/DELETE — too broad
--   * `opportunity_pain_points` junction RLS not enabled
--   * `pain_cluster_members` junction RLS not enabled
--
-- Sprint 70 H1 (additional fix):
--   * REVOKE ALL ON ... FROM anon for all pipeline tables
--   * Supabase auto-grants ALL to anon + authenticated on new tables;
--     RLS policies only ADD grants, never remove the default ones.
--     Without an explicit REVOKE, anon could SELECT pipeline data.
--
-- Defence-in-depth principle:
--   Aggregate pipeline data is derived from public Reddit/GitHub content and
--   is intentionally readable by all authenticated users. The service role
--   policy remains in place for write access (pipeline / admin). This way,
--   if a service-role key ever leaks, the blast radius is limited to the
--   specific claims that need it.
--
-- User-private tables (saved_opportunities, watchlists, alerts, portfolio_items,
-- notifications, weekly_digests) already have user-scoped policies and are
-- untouched here.
-- ============================================================================

-- 1. opportunities: read-only for authenticated users
DROP POLICY IF EXISTS "authenticated_read_opportunities" ON public.opportunities;
CREATE POLICY "authenticated_read_opportunities"
  ON public.opportunities
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. raw_posts: read-only for authenticated users (admin ops read via service role)
DROP POLICY IF EXISTS "authenticated_read_raw_posts" ON public.raw_posts;
CREATE POLICY "authenticated_read_raw_posts"
  ON public.raw_posts
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. pain_points: read-only for authenticated users
DROP POLICY IF EXISTS "authenticated_read_pain_points" ON public.pain_points;
CREATE POLICY "authenticated_read_pain_points"
  ON public.pain_points
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. pain_clusters: read-only for authenticated users
DROP POLICY IF EXISTS "authenticated_read_pain_clusters" ON public.pain_clusters;
CREATE POLICY "authenticated_read_pain_clusters"
  ON public.pain_clusters
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. pain_point_embeddings: tighten — read-only for authenticated users.
-- (service_role still has full access via the existing policy for the pipeline.)
DROP POLICY IF EXISTS "Authenticated users can view embeddings" ON public.pain_point_embeddings;
DROP POLICY IF EXISTS "Authenticated users can insert embeddings" ON public.pain_point_embeddings;
DROP POLICY IF EXISTS "Authenticated users can delete embeddings" ON public.pain_point_embeddings;

CREATE POLICY "authenticated_read_pain_point_embeddings"
  ON public.pain_point_embeddings
  FOR SELECT
  TO authenticated
  USING (true);

-- 6. Junction tables: enable RLS + read-only for authenticated users
ALTER TABLE public.opportunity_pain_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pain_cluster_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_read_opportunity_pain_points" ON public.opportunity_pain_points;
CREATE POLICY "authenticated_read_opportunity_pain_points"
  ON public.opportunity_pain_points
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_read_pain_cluster_members" ON public.pain_cluster_members;
CREATE POLICY "authenticated_read_pain_cluster_members"
  ON public.pain_cluster_members
  FOR SELECT
  TO authenticated
  USING (true);

-- 7. service_role policies: ensure full access (idempotent re-create).
-- These already exist; the DROP IF EXISTS + CREATE block guarantees parity
-- even if a previous migration was edited.
DROP POLICY IF EXISTS "service_role_full_access_opportunities" ON public.opportunities;
CREATE POLICY "service_role_full_access_opportunities"
  ON public.opportunities FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_full_access_raw_posts" ON public.raw_posts;
CREATE POLICY "service_role_full_access_raw_posts"
  ON public.raw_posts FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_full_access_pain_points" ON public.pain_points;
CREATE POLICY "service_role_full_access_pain_points"
  ON public.pain_points FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_full_access_pain_clusters" ON public.pain_clusters;
CREATE POLICY "service_role_full_access_pain_clusters"
  ON public.pain_clusters FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_full_access_pain_point_embeddings" ON public.pain_point_embeddings;
CREATE POLICY "service_role_full_access_pain_point_embeddings"
  ON public.pain_point_embeddings FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_full_access_opportunity_pain_points" ON public.opportunity_pain_points;
CREATE POLICY "service_role_full_access_opportunity_pain_points"
  ON public.opportunity_pain_points FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_full_access_pain_cluster_members" ON public.pain_cluster_members;
CREATE POLICY "service_role_full_access_pain_cluster_members"
  ON public.pain_cluster_members FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 8. Verification block (no-op on re-run; surfaces errors via raised exception)
DO $$
DECLARE
  missing_count int;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND t.tablename IN (
      'opportunities', 'raw_posts', 'pain_points', 'pain_clusters',
      'pain_point_embeddings', 'opportunity_pain_points', 'pain_cluster_members'
    )
    AND NOT t.rowsecurity;

  IF missing_count > 0 THEN
    RAISE EXCEPTION 'RLS not enabled on % pipeline tables after migration', missing_count;
  END IF;
END
$$;

-- ============================================================================
-- Sprint 70 fix: revoke default privileges from anon role.
--
-- Supabase auto-grants ALL on public tables to both anon and authenticated
-- when migrations create tables. RLS policies only ADD grants; they do
-- not remove the default ones. Without an explicit REVOKE, the anon role
-- can SELECT public pipeline data even when no anon policy exists.
--
-- Pipeline tables should be readable by authenticated users (login required)
-- and service_role (pipeline + admin), but NEVER by anon.
-- ============================================================================

REVOKE ALL ON public.opportunities FROM anon;
REVOKE ALL ON public.raw_posts FROM anon;
REVOKE ALL ON public.pain_points FROM anon;
REVOKE ALL ON public.pain_clusters FROM anon;
REVOKE ALL ON public.pain_point_embeddings FROM anon;
REVOKE ALL ON public.opportunity_pain_points FROM anon;
REVOKE ALL ON public.pain_cluster_members FROM anon;

-- Service role still needs full access — keep explicit grant.
GRANT ALL ON public.opportunities TO service_role;
GRANT ALL ON public.raw_posts TO service_role;
GRANT ALL ON public.pain_points TO service_role;
GRANT ALL ON public.pain_clusters TO service_role;
GRANT ALL ON public.pain_point_embeddings TO service_role;
GRANT ALL ON public.opportunity_pain_points TO service_role;
GRANT ALL ON public.pain_cluster_members TO service_role;

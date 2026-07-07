-- ============================================================================
-- Migration: Create pain_clusters table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pain_clusters (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null
);

ALTER TABLE public.pain_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_pain_clusters"
  ON public.pain_clusters FOR ALL TO service_role USING (true) WITH CHECK (true);

-- pain_cluster_members junction table (many-to-many)
CREATE TABLE IF NOT EXISTS public.pain_cluster_members (
  cluster_id uuid NOT NULL REFERENCES public.pain_clusters(id) ON DELETE CASCADE,
  pain_point_id uuid NOT NULL REFERENCES public.pain_points(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cluster_id, pain_point_id)
);

CREATE INDEX IF NOT EXISTS pain_cluster_members_pain_point_id_idx 
  ON public.pain_cluster_members (pain_point_id);

COMMENT ON TABLE public.pain_cluster_members IS 'Junction table for many-to-many relationship between pain_points and pain_clusters';
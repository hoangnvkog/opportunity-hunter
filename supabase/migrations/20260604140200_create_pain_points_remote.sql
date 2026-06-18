-- ============================================================================
-- Replacement migration for pain_points table
-- This migration reflects the ACTUAL remote schema (source of truth)
-- DO NOT apply if tables already exist - this is for documentation/future use
-- ============================================================================

-- pain_points table (as it exists in remote)
-- NOTE: This table already exists in the remote database with these columns:
-- - id (uuid, PK)
-- - description (text)
-- - severity (integer)
-- - frequency (integer)
-- - buying_intent (numeric)
-- - created_at (timestamptz)

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
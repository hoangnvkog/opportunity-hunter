-- ============================================================================
-- Replacement migration for opportunities table
-- This migration reflects the ACTUAL remote schema (source of truth)
-- DO NOT apply if tables already exist - this is for documentation/future use
-- ============================================================================

-- opportunities table (as it exists in remote)
-- NOTE: This table already exists in the remote database with these columns:
-- - id (uuid, PK)
-- - cluster_id (uuid, FK -> pain_clusters.id)
-- - title (text) -- NEW - not in old migration
-- - description (text) -- NEW - not in old migration
-- - score (integer)
-- - frequency (integer)
-- - severity (numeric)
-- - buying_intent (numeric)
-- - created_at (timestamptz)

-- opportunity_pain_points junction table (many-to-many)
CREATE TABLE IF NOT EXISTS public.opportunity_pain_points (
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  pain_point_id uuid NOT NULL REFERENCES public.pain_points(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (opportunity_id, pain_point_id)
);

CREATE INDEX IF NOT EXISTS opportunity_pain_points_pain_point_id_idx 
  ON public.opportunity_pain_points (pain_point_id);

COMMENT ON TABLE public.opportunity_pain_points IS 'Junction table for many-to-many relationship between opportunities and pain_points';
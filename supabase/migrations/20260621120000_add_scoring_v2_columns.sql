-- ============================================================================
-- Add Scoring Engine v2 columns to opportunities table
-- Sprint 38: Weighted scoring engine
-- ============================================================================

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS cluster_size integer,
  ADD COLUMN IF NOT EXISTS recency_score numeric(4,3),
  ADD COLUMN IF NOT EXISTS source_diversity numeric(4,3);

COMMENT ON COLUMN public.opportunities.cluster_size
  IS 'Number of pain points in the associated cluster. Nullable for legacy rows.';

COMMENT ON COLUMN public.opportunities.recency_score
  IS 'Recency score 0-1: higher means more recent source posts. Nullable for legacy rows.';

COMMENT ON COLUMN public.opportunities.source_diversity
  IS 'Source diversity score 0-1: higher means pain found across more platforms. Nullable for legacy rows.';

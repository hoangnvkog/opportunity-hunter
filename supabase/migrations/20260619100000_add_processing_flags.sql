-- ============================================================================
-- Migration: 20260619100000_add_processing_flags.sql
-- Purpose : Add boolean flags to track incremental pipeline processing
-- ============================================================================

-- raw_posts.processed - marks posts that have been processed for pain point extraction
ALTER TABLE public.raw_posts ADD COLUMN IF NOT EXISTS processed boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS raw_posts_processed_idx ON public.raw_posts (processed);

-- pain_points.clustered - marks pain points that have been clustered
ALTER TABLE public.pain_points ADD COLUMN IF NOT EXISTS clustered boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS pain_points_clustered_idx ON public.pain_points (clustered);

-- pain_clusters.opportunity_generated - marks clusters that have opportunities generated
ALTER TABLE public.pain_clusters ADD COLUMN IF NOT EXISTS opportunity_generated boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS pain_clusters_opportunity_generated_idx ON public.pain_clusters (opportunity_generated);

-- opportunities.idea_generated - marks opportunities that have startup ideas generated
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS idea_generated boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS opportunities_idea_generated_idx ON public.opportunities (idea_generated);

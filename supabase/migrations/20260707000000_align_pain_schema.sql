-- ============================================================================
-- Migration: Align pain_points + pain_clusters with current schema
-- Sprint 66 follow-up: code expects columns that the original 2026-06-04
-- remote migration didn't include. Apply missing columns without data loss.
-- ============================================================================

-- pain_points: add raw_post_id, category, clustered
ALTER TABLE public.pain_points
  ADD COLUMN IF NOT EXISTS raw_post_id uuid,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS clustered boolean NOT NULL DEFAULT false;

-- Backfill raw_post_id for any pre-existing rows so the new NOT NULL semantics
-- (FK enforced in code) don't trip on legacy data. Point at the most recent
-- raw_post; nullable keep for orphans.
UPDATE public.pain_points pp
SET raw_post_id = (
  SELECT rp.id FROM public.raw_posts rp ORDER BY rp.created_at DESC LIMIT 1
)
WHERE pp.raw_post_id IS NULL;

-- Indexes to keep joins / filters cheap
CREATE INDEX IF NOT EXISTS pain_points_raw_post_id_idx
  ON public.pain_points (raw_post_id);
CREATE INDEX IF NOT EXISTS pain_points_category_idx
  ON public.pain_points (category);
CREATE INDEX IF NOT EXISTS pain_points_clustered_idx
  ON public.pain_points (clustered);

-- pain_clusters: add cluster_size, opportunity_generated, created_at
ALTER TABLE public.pain_clusters
  ADD COLUMN IF NOT EXISTS cluster_size integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opportunity_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS pain_clusters_created_at_idx
  ON public.pain_clusters (created_at DESC);
CREATE INDEX IF NOT EXISTS pain_clusters_opportunity_generated_idx
  ON public.pain_clusters (opportunity_generated);

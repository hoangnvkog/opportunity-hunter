-- ============================================================================
-- Migration: 20260621050000_expand_startup_ideas.sql
-- Purpose : Add business-model fields and created_at to startup_ideas.
-- Spec    : Sprint 30 — Startup Idea Detail Page
-- ============================================================================

-- Add created_at timestamp (consistent with other tables)
ALTER TABLE public.startup_ideas
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Business model fields (nullable — older ideas may not have them)
ALTER TABLE public.startup_ideas
  ADD COLUMN IF NOT EXISTS customer     text,
  ADD COLUMN IF NOT EXISTS distribution text,
  ADD COLUMN IF NOT EXISTS competitors  text;

-- Length constraints (only when value is present)
ALTER TABLE public.startup_ideas
  ADD CONSTRAINT startup_ideas_customer_len     check (customer     is null or char_length(customer)     between 1 and 2000),
  ADD CONSTRAINT startup_ideas_distribution_len check (distribution is null or char_length(distribution) between 1 and 2000),
  ADD CONSTRAINT startup_ideas_competitors_len  check (competitors  is null or char_length(competitors)  between 1 and 2000);

-- Index for time-based ordering
CREATE INDEX IF NOT EXISTS startup_ideas_created_at_idx
  ON public.startup_ideas (created_at DESC);

-- Documentation
COMMENT ON COLUMN public.startup_ideas.created_at   IS 'Timestamp when this idea was generated.';
COMMENT ON COLUMN public.startup_ideas.customer     IS 'Target customer segment.';
COMMENT ON COLUMN public.startup_ideas.distribution IS 'Distribution channels / go-to-market strategy.';
COMMENT ON COLUMN public.startup_ideas.competitors  IS 'Known competitors or alternatives.';

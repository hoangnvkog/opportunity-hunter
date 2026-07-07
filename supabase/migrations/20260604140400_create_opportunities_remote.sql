-- ============================================================================
-- Migration: Create opportunities table + opportunity_pain_points junction
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.opportunities (
  id             uuid primary key default gen_random_uuid(),
  cluster_id     uuid not null references public.pain_clusters(id) on delete cascade,
  title          text not null,
  description    text not null,
  score          integer not null default 0,
  frequency      integer not null default 0,
  severity       numeric not null default 0,
  buying_intent  numeric not null default 0,
  created_at     timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS opportunities_cluster_id_idx ON public.opportunities (cluster_id);
CREATE INDEX IF NOT EXISTS opportunities_score_idx ON public.opportunities (score desc);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_opportunities"
  ON public.opportunities FOR ALL TO service_role USING (true) WITH CHECK (true);

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
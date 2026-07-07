-- ============================================================================
-- Migration: Create pain_points table + pain_cluster_members junction
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pain_points (
  id           uuid        primary key default gen_random_uuid(),
  description  text        not null,
  severity     integer     not null default 1,
  frequency    integer     not null default 1,
  buying_intent numeric    not null default 0,
  created_at   timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS pain_points_created_at_idx ON public.pain_points (created_at desc);

ALTER TABLE public.pain_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_pain_points"
  ON public.pain_points FOR ALL TO service_role USING (true) WITH CHECK (true);
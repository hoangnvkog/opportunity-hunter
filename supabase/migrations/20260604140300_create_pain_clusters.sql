-- ============================================================================
-- Migration: 20260604140300_create_pain_clusters.sql
-- Purpose : Create the `pain_clusters` table.
-- Spec    : docs/DATABASE_DESIGN.md
--             - id
--             - cluster_name
--             - description
--
-- Notes   : Spec has no `created_at`. We deliberately do not add one.
-- ============================================================================

create table if not exists public.pain_clusters (
  id           uuid primary key default gen_random_uuid(),
  cluster_name text not null,
  description  text not null,

  constraint pain_clusters_name_length        check (char_length(cluster_name) between 1 and 200),
  constraint pain_clusters_description_length check (char_length(description)  between 1 and 2000)
);

-- Indexes -------------------------------------------------------------------
-- No created_at -> no time-ordering index needed. The spec doesn't define
-- a unique constraint on `cluster_name`; we leave it permissive for now
-- and let the application layer enforce naming.

-- Documentation -------------------------------------------------------------
comment on table  public.pain_clusters             is 'Thematic clusters of related pain points.';
comment on column public.pain_clusters.id          is 'Primary key (UUID v4).';
comment on column public.pain_clusters.cluster_name is 'Short, human-friendly name of the cluster.';
comment on column public.pain_clusters.description is 'Long-form description of what this cluster represents.';

-- Row Level Security --------------------------------------------------------
alter table public.pain_clusters enable row level security;

drop policy if exists "service_role_full_access_pain_clusters" on public.pain_clusters;
create policy "service_role_full_access_pain_clusters"
  on public.pain_clusters
  for all
  to service_role
  using (true)
  with check (true);

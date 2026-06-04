-- ============================================================================
-- Migration: 20260604140000_create_sources.sql
-- Purpose : Create the `sources` table.
-- Spec    : docs/DATABASE_DESIGN.md
--             - id
--             - name
--             - type
--             - url
--             - created_at
-- ============================================================================

create table if not exists public.sources (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  type       text        not null,
  url        text        not null,
  created_at timestamptz not null default now(),

  constraint sources_name_length  check (char_length(name) between 1 and 200),
  constraint sources_type_length  check (char_length(type) between 1 and 50),
  constraint sources_url_length   check (char_length(url)  between 1 and 2048),
  constraint sources_url_format   check (url ~* '^https?://')
);

-- Indexes -------------------------------------------------------------------
create index if not exists sources_type_idx       on public.sources (type);
create index if not exists sources_created_at_idx on public.sources (created_at desc);

-- Documentation -------------------------------------------------------------
comment on table  public.sources            is 'External platforms we collect raw posts from (e.g. Reddit, App Reviews).';
comment on column public.sources.id         is 'Primary key (UUID v4).';
comment on column public.sources.name       is 'Human-friendly source name.';
comment on column public.sources.type       is 'Source type / channel (e.g. reddit, app_review).';
comment on column public.sources.url        is 'Canonical URL for the source.';
comment on column public.sources.created_at is 'Timestamp the source row was created.';

-- Row Level Security --------------------------------------------------------
alter table public.sources enable row level security;

drop policy if exists "service_role_full_access_sources" on public.sources;
create policy "service_role_full_access_sources"
  on public.sources
  for all
  to service_role
  using (true)
  with check (true);

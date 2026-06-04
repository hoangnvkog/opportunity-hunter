-- ============================================================================
-- Migration: 20260604140100_create_raw_posts.sql
-- Purpose : Create the `raw_posts` table.
-- Spec    : docs/DATABASE_DESIGN.md
--             - id
--             - source          (string, the source name; not a FK)
--             - title
--             - content
--             - url
--             - score
--             - created_at
--
-- Notes   : The spec stores `source` as a free-form string, not a FK to
--           `sources.id`. We honour that — referential integrity is the
--           application layer's job. This is a deliberate design choice
--           documented in DEVELOPMENT_RULES.md; the rationale is that
--           `raw_posts` may outlive their `sources` row in some
--           ingest pipelines.
-- ============================================================================

create table if not exists public.raw_posts (
  id         uuid        primary key default gen_random_uuid(),
  source     text        not null,
  title      text        not null,
  content    text        not null,
  url        text        not null,
  score      integer     not null default 0,
  created_at timestamptz not null default now(),

  constraint raw_posts_source_length  check (char_length(source)  between 1 and 200),
  constraint raw_posts_title_length   check (char_length(title)   between 1 and 500),
  constraint raw_posts_content_length check (char_length(content) >= 0),
  constraint raw_posts_url_length     check (char_length(url)     between 1 and 2048),
  constraint raw_posts_url_format     check (url ~* '^https?://'),
  constraint raw_posts_score_nonneg   check (score >= 0)
);

-- Indexes -------------------------------------------------------------------
create index if not exists raw_posts_source_idx      on public.raw_posts (source);
create index if not exists raw_posts_score_idx       on public.raw_posts (score desc);
create index if not exists raw_posts_created_at_idx  on public.raw_posts (created_at desc);
-- Composite for "latest top-scoring posts from a source" queries
create index if not exists raw_posts_source_score_idx on public.raw_posts (source, score desc, created_at desc);

-- Documentation -------------------------------------------------------------
comment on table  public.raw_posts            is 'Posts harvested from external sources, prior to AI analysis.';
comment on column public.raw_posts.id         is 'Primary key (UUID v4).';
comment on column public.raw_posts.source     is 'Source name (e.g. "r/SaaS"). Free-form string, not a FK.';
comment on column public.raw_posts.title      is 'Post title / headline.';
comment on column public.raw_posts.content    is 'Post body / selftext.';
comment on column public.raw_posts.url        is 'Canonical URL to the original post.';
comment on column public.raw_posts.score      is 'Upvotes / likes / points from the source platform.';
comment on column public.raw_posts.created_at is 'Timestamp we persisted this row.';

-- Row Level Security --------------------------------------------------------
alter table public.raw_posts enable row level security;

drop policy if exists "service_role_full_access_raw_posts" on public.raw_posts;
create policy "service_role_full_access_raw_posts"
  on public.raw_posts
  for all
  to service_role
  using (true)
  with check (true);

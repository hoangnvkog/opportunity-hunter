-- ============================================================================
-- Opportunity Hunter - Complete Database Setup
-- Run this in Supabase SQL Editor to create all tables
-- ============================================================================

-- 1. Enable pgcrypto extension
create extension if not exists "pgcrypto";

-- ============================================================================
-- 2. Create sources table
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

create index if not exists sources_type_idx       on public.sources (type);
create index if not exists sources_created_at_idx on public.sources (created_at desc);

comment on table  public.sources            is 'External platforms we collect raw posts from (e.g. Reddit, App Reviews).';
comment on column public.sources.id         is 'Primary key (UUID v4).';
comment on column public.sources.name       is 'Human-friendly source name.';
comment on column public.sources.type       is 'Source type / channel (e.g. reddit, app_review).';
comment on column public.sources.url        is 'Canonical URL for the source.';
comment on column public.sources.created_at is 'Timestamp the source row was created.';

alter table public.sources enable row level security;
drop policy if exists "service_role_full_access_sources" on public.sources;
create policy "service_role_full_access_sources"
  on public.sources
  for all
  to service_role
  using (true)
  with check (true);

-- ============================================================================
-- 3. Create raw_posts table
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

create index if not exists raw_posts_source_idx      on public.raw_posts (source);
create index if not exists raw_posts_score_idx       on public.raw_posts (score desc);
create index if not exists raw_posts_created_at_idx  on public.raw_posts (created_at desc);
create index if not exists raw_posts_source_score_idx on public.raw_posts (source, score desc, created_at desc);

comment on table  public.raw_posts            is 'Posts harvested from external sources, prior to AI analysis.';
comment on column public.raw_posts.id         is 'Primary key (UUID v4).';
comment on column public.raw_posts.source     is 'Source name (e.g. "r/SaaS"). Free-form string, not a FK.';
comment on column public.raw_posts.title      is 'Post title / headline.';
comment on column public.raw_posts.content    is 'Post body / selftext.';
comment on column public.raw_posts.url        is 'Canonical URL to the original post.';
comment on column public.raw_posts.score      is 'Upvotes / likes / points from the source platform.';
comment on column public.raw_posts.created_at is 'Timestamp we persisted this row.';

alter table public.raw_posts enable row level security;
drop policy if exists "service_role_full_access_raw_posts" on public.raw_posts;
create policy "service_role_full_access_raw_posts"
  on public.raw_posts
  for all
  to service_role
  using (true)
  with check (true);

-- ============================================================================
-- 4. Create pain_points table
-- ============================================================================
create table if not exists public.pain_points (
  id            uuid        primary key default gen_random_uuid(),
  raw_post_id   uuid        not null references public.raw_posts(id) on delete cascade,
  pain          text        not null,
  category      text        not null,
  severity      numeric(4,3) not null,
  buying_intent numeric(4,3) not null,
  created_at    timestamptz not null default now(),

  constraint pain_points_pain_length          check (char_length(pain)     between 1 and 2000),
  constraint pain_points_category_length      check (char_length(category) between 1 and 100),
  constraint pain_points_severity_range       check (severity      between 0 and 1),
  constraint pain_points_buying_intent_range  check (buying_intent between 0 and 1)
);

create index if not exists pain_points_raw_post_id_idx  on public.pain_points (raw_post_id);
create index if not exists pain_points_category_idx     on public.pain_points (category);
create index if not exists pain_points_severity_idx     on public.pain_points (severity desc);
create index if not exists pain_points_buying_intent_idx on public.pain_points (buying_intent desc);
create index if not exists pain_points_created_at_idx   on public.pain_points (created_at desc);

comment on table  public.pain_points                is 'Pain points extracted from raw posts.';
comment on column public.pain_points.id             is 'Primary key (UUID v4).';
comment on column public.pain_points.raw_post_id    is 'FK -> raw_posts.id. The post this pain was extracted from.';
comment on column public.pain_points.pain           is 'Pain statement.';
comment on column public.pain_points.category       is 'Normalized category (e.g. "billing", "onboarding").';
comment on column public.pain_points.severity       is 'Severity score in [0, 1].';
comment on column public.pain_points.buying_intent  is 'Buying intent score in [0, 1].';
comment on column public.pain_points.created_at     is 'Timestamp the row was created.';

alter table public.pain_points enable row level security;
drop policy if exists "service_role_full_access_pain_points" on public.pain_points;
create policy "service_role_full_access_pain_points"
  on public.pain_points
  for all
  to service_role
  using (true)
  with check (true);

-- ============================================================================
-- 5. Create pain_clusters table
-- ============================================================================
create table if not exists public.pain_clusters (
  id           uuid primary key default gen_random_uuid(),
  cluster_name text not null,
  description  text not null,

  constraint pain_clusters_name_length        check (char_length(cluster_name) between 1 and 200),
  constraint pain_clusters_description_length check (char_length(description)  between 1 and 2000)
);

comment on table  public.pain_clusters             is 'Thematic clusters of related pain points.';
comment on column public.pain_clusters.id          is 'Primary key (UUID v4).';
comment on column public.pain_clusters.cluster_name is 'Short, human-friendly name of the cluster.';
comment on column public.pain_clusters.description is 'Long-form description of what this cluster represents.';

alter table public.pain_clusters enable row level security;
drop policy if exists "service_role_full_access_pain_clusters" on public.pain_clusters;
create policy "service_role_full_access_pain_clusters"
  on public.pain_clusters
  for all
  to service_role
  using (true)
  with check (true);

-- ============================================================================
-- 6. Create opportunities table
-- ============================================================================
create table if not exists public.opportunities (
  id            uuid        primary key default gen_random_uuid(),
  cluster_id    uuid        not null references public.pain_clusters(id) on delete cascade,
  score         numeric(6,3) not null,
  frequency     integer     not null default 0,
  severity      numeric(4,3) not null,
  buying_intent numeric(4,3) not null,

  constraint opportunities_score_range          check (score         between 0 and 100),
  constraint opportunities_frequency_nonneg    check (frequency     >= 0),
  constraint opportunities_severity_range      check (severity      between 0 and 1),
  constraint opportunities_buying_intent_range check (buying_intent between 0 and 1)
);

create index if not exists opportunities_cluster_id_idx     on public.opportunities (cluster_id);
create index if not exists opportunities_score_idx          on public.opportunities (score desc);
create index if not exists opportunities_frequency_idx      on public.opportunities (frequency desc);
create index if not exists opportunities_buying_intent_idx  on public.opportunities (buying_intent desc);
create index if not exists opportunities_cluster_score_idx  on public.opportunities (cluster_id, score desc);

comment on table  public.opportunities                is 'Scored opportunities, summarised from a pain cluster.';
comment on column public.opportunities.id             is 'Primary key (UUID v4).';
comment on column public.opportunities.cluster_id     is 'FK -> pain_clusters.id.';
comment on column public.opportunities.score          is 'Derived opportunity score in [0, 100]. Higher = better.';
comment on column public.opportunities.frequency      is 'Number of pain points mapped to this opportunity.';
comment on column public.opportunities.severity       is 'Severity in [0, 1].';
comment on column public.opportunities.buying_intent  is 'Buying intent in [0, 1].';

alter table public.opportunities enable row level security;
drop policy if exists "service_role_full_access_opportunities" on public.opportunities;
create policy "service_role_full_access_opportunities"
  on public.opportunities
  for all
  to service_role
  using (true)
  with check (true);

-- ============================================================================
-- 7. Create startup_ideas table
-- ============================================================================
create table if not exists public.startup_ideas (
  id             uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  problem        text not null,
  solution       text not null,
  mvp            text not null,
  pricing        text not null,

  constraint startup_ideas_problem_len  check (char_length(problem)  between 1 and 2000),
  constraint startup_ideas_solution_len check (char_length(solution) between 1 and 2000),
  constraint startup_ideas_mvp_len      check (char_length(mvp)      between 1 and 2000),
  constraint startup_ideas_pricing_len  check (char_length(pricing)  between 1 and 1000)
);

create index if not exists startup_ideas_opportunity_id_idx on public.startup_ideas (opportunity_id);

comment on table  public.startup_ideas                 is 'Concrete startup ideas derived from opportunities.';
comment on column public.startup_ideas.id              is 'Primary key (UUID v4).';
comment on column public.startup_ideas.opportunity_id  is 'FK -> opportunities.id.';
comment on column public.startup_ideas.problem         is 'Short problem statement.';
comment on column public.startup_ideas.solution        is 'Proposed solution / product description.';
comment on column public.startup_ideas.mvp             is 'Minimum viable product description.';
comment on column public.startup_ideas.pricing         is 'Pricing model / price point summary.';

alter table public.startup_ideas enable row level security;
drop policy if exists "service_role_full_access_startup_ideas" on public.startup_ideas;
create policy "service_role_full_access_startup_ideas"
  on public.startup_ideas
  for all
  to service_role
  using (true)
  with check (true);

-- ============================================================================
-- Done! All tables created successfully.
-- ============================================================================

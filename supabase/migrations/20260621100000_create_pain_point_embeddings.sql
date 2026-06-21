-- Enable pgvector extension
create extension if not exists vector;

-- Create pain_point_embeddings table
create table if not exists public.pain_point_embeddings (
  id uuid primary key default gen_random_uuid(),
  pain_point_id uuid not null references public.pain_points(id) on delete cascade,
  embedding vector(1536) not null,
  created_at timestamptz default now(),
  unique(pain_point_id)
);

-- Create index for fast similarity search using ivfflat
-- Note: This index requires at least 1000 rows to be effective
-- We use lists = 100 as a starting point; adjust based on data size
create index if not exists pain_point_embeddings_embedding_idx
  on public.pain_point_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Create index for fast lookup by pain_point_id
create index if not exists pain_point_embeddings_pain_point_id_idx
  on public.pain_point_embeddings (pain_point_id);

-- Enable RLS
alter table public.pain_point_embeddings enable row level security;

-- Policies for authenticated users
create policy "Authenticated users can view embeddings"
  on public.pain_point_embeddings
  for select
  to authenticated
  using (true);

create policy "Authenticated users can insert embeddings"
  on public.pain_point_embeddings
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can delete embeddings"
  on public.pain_point_embeddings
  for delete
  to authenticated
  using (true);

-- Function to find similar pain points using cosine distance
create or replace function find_similar_pain_points(
  query_embedding vector(1536),
  match_limit int default 10,
  match_threshold float default 0.7
)
returns table (
  pain_point_id uuid,
  similarity float,
  description text,
  category text,
  severity numeric,
  buying_intent numeric
)
language plpgsql
as $$
begin
  return query
  select
    ppe.pain_point_id,
    1 - (ppe.embedding <=> query_embedding) as similarity,
    pp.description,
    pp.category,
    pp.severity,
    pp.buying_intent
  from public.pain_point_embeddings ppe
  join public.pain_points pp on pp.id = ppe.pain_point_id
  where 1 - (ppe.embedding <=> query_embedding) > match_threshold
  order by ppe.embedding <=> query_embedding
  limit match_limit;
end;
$$;

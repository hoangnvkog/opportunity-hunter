-- Resize pain_point_embeddings.vector(1536) -> vector(1024).
--
-- NVIDIA nvidia/nv-embedqa-e5-v5 returns 1024-dim vectors, but the
-- original migration declared vector(1536) (matching OpenAI's
-- text-embedding-3-small). Pipeline now runs on NVIDIA, so we need
-- 1024 dimensions to match the actual embeddings produced.
--
-- The ivfflat index must be rebuilt because the dimension stored
-- in the operator class must match the column; we also drop the
-- helper function that referenced 1536 since it is no longer
-- applicable.

DROP INDEX IF EXISTS public.pain_point_embeddings_embedding_idx;
DROP FUNCTION IF EXISTS public.match_pain_points(vector(1536), float, int);

ALTER TABLE public.pain_point_embeddings
  ALTER COLUMN embedding TYPE vector(1024) USING embedding::vector(1024);

CREATE INDEX IF NOT EXISTS pain_point_embeddings_embedding_idx
  ON public.pain_point_embeddings
  USING ivfflat (embedding vector_cosine_ops);

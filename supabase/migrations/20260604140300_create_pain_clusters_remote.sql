-- ============================================================================
-- Replacement migration for pain_clusters table  
-- This migration reflects the ACTUAL remote schema (source of truth)
-- DO NOT apply if tables already exist - this is for documentation/future use
-- ============================================================================

-- pain_clusters table (as it exists in remote)
-- NOTE: This table already exists in the remote database with these columns:
-- - id (uuid, PK)
-- - name (text) -- NOTE: NOT cluster_name
-- - description (text)
-- There is NO created_at column

-- The old migration used 'cluster_name' but the actual column is 'name'
-- Use name instead of cluster_name in all queries
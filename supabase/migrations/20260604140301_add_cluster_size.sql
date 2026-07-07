-- Add cluster_size column to pain_clusters table
-- This column stores the number of pain points in each cluster

ALTER TABLE pain_clusters ADD COLUMN IF NOT EXISTS cluster_size INTEGER DEFAULT 0;

-- Add index for faster queries on cluster_size
CREATE INDEX IF NOT EXISTS idx_pain_clusters_cluster_size ON pain_clusters(cluster_size);

-- Add comment
COMMENT ON COLUMN pain_clusters.cluster_size IS 'Number of pain points in this semantic cluster';

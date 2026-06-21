-- Add sources count to pipeline_runs table
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS sources INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN pipeline_runs.sources IS 'Number of sources that successfully contributed posts';

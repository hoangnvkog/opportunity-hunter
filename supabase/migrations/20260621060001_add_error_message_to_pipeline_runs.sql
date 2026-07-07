-- Add error_message column to pipeline_runs table
-- This column stores error details when a pipeline run fails

ALTER TABLE pipeline_runs 
ADD COLUMN IF NOT EXISTS error_message TEXT;

COMMENT ON COLUMN pipeline_runs.error_message IS 'Error message if pipeline run failed, null if successful';

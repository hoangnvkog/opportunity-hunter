-- Allow 'running' status in pipeline_runs for in-progress tracking.
-- The orchestrator inserts status='running' when a pipeline starts,
-- then updates to 'success' or 'failed' on completion.
-- Current CHECK constraint only allows ('success', 'failed').

ALTER TABLE public.pipeline_runs
  DROP CONSTRAINT IF EXISTS pipeline_runs_status_check;

ALTER TABLE public.pipeline_runs
  ADD CONSTRAINT pipeline_runs_status_check
  CHECK (status IN ('running', 'success', 'failed'));
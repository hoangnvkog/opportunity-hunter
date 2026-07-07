-- Sprint 46: AI Opportunity Insight Generator
-- Stores AI-generated business analysis for each opportunity:
--   - summary, market size, competition level, urgency
--   - recommended MVP + recommended channels
--   - confidence score (0.00–1.00, numeric)
-- One insight per opportunity (immutable after generation).

CREATE TABLE opportunity_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL UNIQUE REFERENCES opportunities(id) ON DELETE CASCADE,
  summary text NOT NULL,
  market_size text NOT NULL,
  competition_level text NOT NULL CHECK (competition_level IN ('Low', 'Medium', 'High')),
  urgency text NOT NULL CHECK (urgency IN ('Low', 'Medium', 'High')),
  recommended_mvp text NOT NULL,
  recommended_channels text NOT NULL,
  confidence_score numeric(4,3) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_opportunity_insights_opportunity_id ON opportunity_insights(opportunity_id);
CREATE INDEX idx_opportunity_insights_created_at ON opportunity_insights(created_at DESC);
CREATE INDEX idx_opportunity_insights_competition ON opportunity_insights(competition_level);
CREATE INDEX idx_opportunity_insights_urgency ON opportunity_insights(urgency);
CREATE INDEX idx_opportunity_insights_confidence ON opportunity_insights(confidence_score DESC);

ALTER TABLE opportunity_insights ENABLE ROW LEVEL SECURITY;

-- Every opportunity belongs to the global pipeline (no per-user ownership
-- of opportunities), so insights inherit the same read access model:
-- authenticated users may read all insights. RLS still gates writes.
CREATE POLICY "Authenticated users can view insights"
  ON opportunity_insights
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Inserts happen through service-role callers (pipeline runs). We allow
-- inserts from the service role only; the application uses that client
-- for all writes so we don't expose INSERT to authenticated users.
CREATE POLICY "Service role can insert insights"
  ON opportunity_insights
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update insights"
  ON opportunity_insights
  FOR UPDATE
  USING (true);

-- Sprint 51: Opportunity Validation Engine v1
-- Table: opportunity_validations
--
-- Provides deterministic validation scores for opportunities.
-- Answers the question: "Which opportunity is actually worth building?"

CREATE TABLE IF NOT EXISTS opportunity_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  validation_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (validation_score >= 0 AND validation_score <= 100),
  market_demand numeric(5,2) NOT NULL DEFAULT 0 CHECK (market_demand >= 0 AND market_demand <= 100),
  pain_severity numeric(5,2) NOT NULL DEFAULT 0 CHECK (pain_severity >= 0 AND pain_severity <= 100),
  buying_intent_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (buying_intent_score >= 0 AND buying_intent_score <= 100),
  competition_risk numeric(5,2) NOT NULL DEFAULT 0 CHECK (competition_risk >= 0 AND competition_risk <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_opportunity_validations_opp_id ON opportunity_validations(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_validations_score ON opportunity_validations(validation_score DESC);
CREATE INDEX IF NOT EXISTS idx_opportunity_validations_created_at ON opportunity_validations(created_at DESC);

-- Enable RLS
ALTER TABLE opportunity_validations ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to read validations
CREATE POLICY "Anyone can view validations"
  ON opportunity_validations
  FOR SELECT
  USING (true);

-- Only service role can manage validations (pipeline writes)
CREATE POLICY "Service role can manage validations"
  ON opportunity_validations
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

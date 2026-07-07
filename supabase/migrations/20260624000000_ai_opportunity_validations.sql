-- Sprint 52: Opportunity Validation Engine (AI-powered)
-- Replaces Sprint 51 deterministic validation with AI-powered scoring
--
-- Table: opportunity_validations
-- Each opportunity gets validated once by AI (upserted, skip existing)

CREATE TABLE IF NOT EXISTS opportunity_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL UNIQUE REFERENCES opportunities(id) ON DELETE CASCADE,
  market_demand numeric(5,2) NOT NULL DEFAULT 0 CHECK (market_demand >= 0 AND market_demand <= 100),
  competition numeric(5,2) NOT NULL DEFAULT 0 CHECK (competition >= 0 AND competition <= 100),
  monetization numeric(5,2) NOT NULL DEFAULT 0 CHECK (monetization >= 0 AND monetization <= 100),
  build_difficulty numeric(5,2) NOT NULL DEFAULT 0 CHECK (build_difficulty >= 0 AND build_difficulty <= 100),
  validation_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (validation_score >= 0 AND validation_score <= 100),
  reasoning text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_opportunity_validations_opp_id ON opportunity_validations(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_validations_score ON opportunity_validations(validation_score DESC);
CREATE INDEX IF NOT EXISTS idx_opportunity_validations_created_at ON opportunity_validations(created_at DESC);

ALTER TABLE opportunity_validations ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read
CREATE POLICY "Anyone can view validations"
  ON opportunity_validations
  FOR SELECT
  USING (true);

-- Only service_role can write (pipeline only)
CREATE POLICY "Service role can manage validations"
  ON opportunity_validations
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
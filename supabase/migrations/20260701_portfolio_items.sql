-- Sprint 60: Portfolio Intelligence Engine
-- Create portfolio_items table + enums + indexes + RLS

-- ==========================================
-- ENUMS
-- ==========================================

CREATE TYPE portfolio_status AS ENUM (
  'WATCHLIST',
  'RESEARCHING',
  'VALIDATED',
  'BUILDING',
  'INVESTED',
  'ARCHIVED'
);

CREATE TYPE portfolio_priority AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

-- ==========================================
-- TABLE: portfolio_items
-- ==========================================

CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  status portfolio_status NOT NULL DEFAULT 'WATCHLIST',
  priority portfolio_priority NOT NULL DEFAULT 'MEDIUM',
  health_score DECIMAL(5,2) CHECK (health_score >= 0 AND health_score <= 100),
  watch_score DECIMAL(5,2) CHECK (watch_score >= 0 AND watch_score <= 100),
  favorite BOOLEAN NOT NULL DEFAULT FALSE,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX idx_portfolio_opportunity ON portfolio_items(opportunity_id);
CREATE INDEX idx_portfolio_status ON portfolio_items(status);
CREATE INDEX idx_portfolio_priority ON portfolio_items(priority);
CREATE INDEX idx_portfolio_favorite ON portfolio_items(favorite) WHERE favorite = TRUE;
CREATE INDEX idx_portfolio_archived ON portfolio_items(archived) WHERE archived = FALSE;
CREATE INDEX idx_portfolio_health ON portfolio_items(health_score DESC) WHERE health_score IS NOT NULL;
CREATE INDEX idx_portfolio_created ON portfolio_items(created_at DESC);

-- ==========================================
-- TRIGGER: updated_at
-- ==========================================

CREATE TRIGGER update_portfolio_items_updated_at
  BEFORE UPDATE ON portfolio_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- RLS
-- ==========================================

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Admin read all
CREATE POLICY portfolio_items_admin_read ON portfolio_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin write all
CREATE POLICY portfolio_items_admin_write ON portfolio_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- User read own (via opportunities created_by)
CREATE POLICY portfolio_items_user_read ON portfolio_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM opportunities
      WHERE opportunities.id = portfolio_items.opportunity_id
      AND opportunities.created_by = auth.uid()
    )
  );

-- User write own (via opportunities created_by)
CREATE POLICY portfolio_items_user_write ON portfolio_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM opportunities
      WHERE opportunities.id = portfolio_items.opportunity_id
      AND opportunities.created_by = auth.uid()
    )
  );

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON TABLE portfolio_items IS 'Sprint 60: Portfolio Intelligence - tracks lifecycle, health, priority of opportunities';
COMMENT ON COLUMN portfolio_items.health_score IS 'Calculated from investment score, backtesting, trend, forecast, validation';
COMMENT ON COLUMN portfolio_items.watch_score IS 'User watchlist score (optional)';
COMMENT ON COLUMN portfolio_items.last_reviewed_at IS 'Last manual review timestamp';

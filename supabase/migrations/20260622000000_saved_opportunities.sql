-- Sprint 42: Saved Opportunities & Favorites
-- Allows users to save opportunities to their personal watchlist

CREATE TABLE saved_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Prevent duplicate saves
  CONSTRAINT unique_user_opportunity UNIQUE (user_id, opportunity_id)
);

-- Indexes for performance
CREATE INDEX idx_saved_opportunities_user_id ON saved_opportunities(user_id);
CREATE INDEX idx_saved_opportunities_opportunity_id ON saved_opportunities(opportunity_id);
CREATE INDEX idx_saved_opportunities_created_at ON saved_opportunities(created_at DESC);

-- Enable Row Level Security
ALTER TABLE saved_opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see/modify their own saved opportunities
CREATE POLICY "Users can view their own saved opportunities"
  ON saved_opportunities
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save opportunities"
  ON saved_opportunities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave their own opportunities"
  ON saved_opportunities
  FOR DELETE
  USING (auth.uid() = user_id);

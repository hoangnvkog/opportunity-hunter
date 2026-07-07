-- Sprint 45: Weekly Opportunity Digest
-- Aggregate last 7 days of activity (alerts/watchlists/opportunities) into a
-- weekly digest per user and queue it for delivery via Resend.

CREATE TABLE weekly_digests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- One digest per user per ISO week
  CONSTRAINT unique_user_week UNIQUE (user_id, week_start)
);

CREATE INDEX idx_weekly_digests_user_id ON weekly_digests(user_id);
CREATE INDEX idx_weekly_digests_week_start ON weekly_digests(week_start DESC);
CREATE INDEX idx_weekly_digests_status ON weekly_digests(status);
CREATE INDEX idx_weekly_digests_created_at ON weekly_digests(created_at DESC);

ALTER TABLE weekly_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weekly digests"
  ON weekly_digests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert weekly digests"
  ON weekly_digests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update weekly digests"
  ON weekly_digests
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Note: weekly_digest_enabled column added in migration 20260623000000_email_notifications.sql

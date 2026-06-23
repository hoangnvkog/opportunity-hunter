-- Sprint 48: Admin Panel & Analytics System
-- Tables: ai_usage_logs, system_logs

-- AI Usage Logs table
CREATE TABLE ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider text NOT NULL,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  estimated_cost numeric(10, 6) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);
CREATE INDEX idx_ai_usage_logs_provider ON ai_usage_logs(provider);
CREATE INDEX idx_ai_usage_logs_model ON ai_usage_logs(model);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only read access
CREATE POLICY "Admins can view all AI usage logs"
  ON ai_usage_logs
  FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Service role can insert AI usage logs"
  ON ai_usage_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- System Logs table
CREATE TABLE system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX idx_system_logs_level_created ON system_logs(level, created_at DESC);

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can view all system logs"
  ON system_logs
  FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Service role can insert system logs"
  ON system_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Add role column to profiles table if not exists
-- This is checked via a separate migration pattern to avoid duplicate column errors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text NOT NULL DEFAULT 'user';
  END IF;
END $$;

-- Add indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
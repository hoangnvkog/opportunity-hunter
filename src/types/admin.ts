// Admin types

export type LogLevel = "info" | "warn" | "error" | "debug";

export type AiProvider = "openai" | "anthropic" | "gemini" | "mock";

export type SystemLogRow = {
  id: string;
  level: LogLevel;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type SystemLogInsert = {
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
};

export type AiUsageLogRow = {
  id: string;
  user_id: string | null;
  provider: AiProvider;
  model: string;
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
  created_at: string;
};

export type AiUsageLogInsert = {
  user_id?: string | null;
  provider: AiProvider;
  model: string;
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
};

export type UserWithProfile = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

export type SubscriptionWithUser = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  plan: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  email?: string;
  name?: string | null;
};
export type Plan = "free" | "pro" | "team";

export type SubscriptionRow = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string; // e.g. 'active', 'canceled', 'incomplete', 'past_due', 'trialing', 'unpaid'
  plan: Plan;
  current_period_start: string | null; // ISO string
  current_period_end: string | null; // ISO string
  created_at: string; // ISO string
};

// Only user_id, status, plan are required; all others have defaults in SQL
export type SubscriptionInsert = {
  user_id: string;
  status: string;
  plan: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
};
export type UsageLimitRow = {
  id: string;
  user_id: string;
  month: string; // format: 'YYYY-MM'
  opportunities_used: number;
  insights_used: number;
  emails_sent: number;
  created_at: string; // ISO string
};

// id and created_at are DB-generated; month and counters have defaults
// user_id is the only required field
// month defaults to the current month in repository methods
// counters default to 0

export type UsageLimitInsert = {
  user_id: string;
  month?: string; // YYYY-MM, defaults to current month in repo
  opportunities_used?: number; // defaults to 0
  insights_used?: number; // defaults to 0
  emails_sent?: number; // defaults to 0
};

export type UsageLimitUpdate = {
  month?: string;
  opportunities_used?: number;
  insights_used?: number;
  emails_sent?: number;
};

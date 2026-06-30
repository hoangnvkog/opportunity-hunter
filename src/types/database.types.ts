/**
 * Supabase generated-style types for Opportunity Hunter.
 *
 * These types are hand-written to mirror the SQL schema in
 * `supabase/migrations/*.sql`. They are the source of truth for the
 * repository layer in `src/lib/db/repositories/*`.
 *
 * If / when the project wires up the Supabase CLI to autogenerate these
 * via `supabase gen types typescript`, the CLI output should be dropped
 * in to replace this file. The shape MUST stay the same so the
 * repository layer keeps compiling.
 *
 * Conventions:
 *   - snake_case fields map 1:1 with the SQL columns.
 *   - `*Insert` types omit server-managed fields (id, created_at).
 *   - `*Update` types make every field optional and never allow the
 *     primary key to be reassigned.
 *   - Nullable columns are typed `T | null` (not `T?`) to match the
 *     runtime shape returned by the Supabase client.
 *
 * Implementation note: Row types are written as **type aliases** (not
 * interfaces) on purpose. TypeScript interfaces do not widen to an
 * index signature the way object types do, which makes them fail the
 * `Row extends Record<string, unknown>` check used by Supabase's
 * `GenericTable` constraint. Type aliases side-step the issue without
 * changing the runtime shape.
 *
 * Source of truth: docs/DATABASE_DESIGN.md
 */

export type Uuid = string;

import type {
  WeeklyDigestRow,
  WeeklyDigestInsert,
  WeeklyDigestUpdate,
} from "./weekly-digest";
import type {
  OpportunityInsightRow,
  OpportunityInsightInsert,
} from "./opportunity-insight";
import type {
  AiUsageLogRow,
  AiUsageLogInsert,
  SystemLogRow,
  SystemLogInsert,
} from "./admin";
import type { SubscriptionRow, SubscriptionInsert, UsageLimitRow, UsageLimitInsert, UsageLimitUpdate } from "./subscription";
import type {
  OpportunityValidationRow,
  OpportunityValidationInsert,
  OpportunityValidationUpdate,
} from "./validation";
import type {
  OpportunityEvidenceRow,
  OpportunityEvidenceInsert,
} from "./evidence";
import type {
  OpportunityForecastRow,
  OpportunityForecastInsert,
} from "./forecast";
import type {
  MarketIntelligenceRow,
  MarketIntelligenceInsert,
} from "./market-intelligence";
import type {
  StartupScoreRow,
  StartupScoreInsert,
} from "./startup-score";
import type {
  VentureReportRow,
  VentureReportInsert,
} from "./venture-report";
import type {
  InvestmentMemoRow,
  InvestmentMemoInsert,
} from "./investment-memo";

/** Numeric(4,3) stored as string by the JS client to avoid float drift. */
export type Decimal3 = string;

/** Numeric(6,3) (e.g. opportunities.score in [0, 100]). */
export type Decimal6 = string;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ---------------------------------------------------------------------------
// Row types (mirror the spec in docs/DATABASE_DESIGN.md)
// ---------------------------------------------------------------------------

export type SourceRow = {
  id: Uuid;
  name: string;
  type: string;
  url: string;
  created_at: string;
};

export type RawPostRow = {
  id: Uuid;
  /** Free-form source name (e.g. "r/SaaS"). Not a FK — see spec. */
  source: string;
  title: string;
  content: string;
  url: string;
  score: number;
  processed: boolean;
  created_at: string;
};

export type PainPointRow = {
  id: Uuid;
  raw_post_id: Uuid;
  description: string;
  category: string;
  severity: Decimal3;
  frequency: number;
  buying_intent: Decimal3;
  clustered: boolean;
  created_at: string;
};

export type PainClusterRow = {
  id: Uuid;
  name: string;
  description: string;
  cluster_size: number;
  opportunity_generated: boolean;
};

export type OpportunityRow = {
  id: Uuid;
  cluster_id: Uuid;
  title: string;
  description: string;
  /** Derived score in [0, 100]. */
  score: Decimal6;
  frequency: number;
  severity: Decimal3;
  buying_intent: Decimal3;
  /** Number of pain points in the cluster (null for legacy rows). */
  cluster_size: number | null;
  /** Recency score 0–1 (null for legacy rows). */
  recency_score: Decimal3 | null;
  /** Source diversity score 0–1 (null for legacy rows). */
  source_diversity: Decimal3 | null;
  idea_generated: boolean;
  created_at: string;
};

export type StartupIdeaRow = {
  id: Uuid;
  opportunity_id: Uuid;
  problem: string;
  solution: string;
  mvp: string;
  pricing: string;
  customer: string | null;
  distribution: string | null;
  competitors: string | null;
  created_at: string;
};

export type PipelineRunRow = {
  id: Uuid;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  sources: number;
  raw_posts: number;
  pain_points: number;
  embeddings: number;
  clusters: number;
  opportunities: number;
  startup_ideas: number;
  average_cluster_size: number | null;
  largest_cluster_size: number | null;
  status: string;
  error_message: string | null;
  created_at: string;
};

export type PainPointEmbeddingRow = {
  id: Uuid;
  pain_point_id: Uuid;
  embedding: number[];
  created_at: string;
};

export type SavedOpportunityRow = {
  id: Uuid;
  user_id: Uuid;
  opportunity_id: Uuid;
  created_at: string;
};

export type SavedOpportunityInsert = {
  id?: Uuid;
  user_id: Uuid;
  opportunity_id: Uuid;
  created_at?: string;
};

export type WatchlistRow = {
  id: Uuid;
  user_id: Uuid;
  name: string;
  search: string | null;
  min_score: number | null;
  min_frequency: number | null;
  min_severity: number | null;
  min_buying_intent: number | null;
  created_at: string;
  updated_at: string;
};

export type WatchlistInsert = {
  user_id: Uuid;
  name: string;
  search?: string | null;
  min_score?: number | null;
  min_frequency?: number | null;
  min_severity?: number | null;
  min_buying_intent?: number | null;
};

export type AlertRow = {
  id: Uuid;
  user_id: Uuid;
  watchlist_id: Uuid;
  opportunity_id: Uuid;
  is_read: boolean;
  created_at: string;
};

export type AlertInsert = {
  user_id: Uuid;
  watchlist_id: Uuid;
  opportunity_id: Uuid;
  is_read?: boolean;
};

export type EmailNotificationRow = {
  id: Uuid;
  user_id: Uuid;
  alert_id: Uuid;
  status: string;
  attempts: number;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};

export type EmailNotificationInsert = {
  id?: Uuid;
  user_id: Uuid;
  alert_id: Uuid;
  status?: string;
  attempts?: number;
  error_message?: string | null;
  sent_at?: string | null;
  created_at?: string;
};

export type NotificationSettingsRow = {
  user_id: Uuid;
  email_enabled: boolean;
  weekly_digest_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type NotificationSettingsInsert = {
  user_id: Uuid;
  email_enabled?: boolean;
  weekly_digest_enabled?: boolean;
  updated_at?: string;
};

export type NotificationSettingsUpdate = {
  user_enabled?: boolean;
  email_enabled?: boolean;
  weekly_digest_enabled?: boolean;
  updated_at?: string;
};

export type ProfileRow = {
  id: Uuid;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Insert types (server-managed fields are optional)
// ---------------------------------------------------------------------------

export type SourceInsert = {
  id?: Uuid;
  name: string;
  type: string;
  url: string;
  created_at?: string;
};

export type RawPostInsert = {
  id?: Uuid;
  source: string;
  title: string;
  content: string;
  url: string;
  score?: number;
  processed?: boolean;
  created_at?: string;
};

export type PainPointInsert = {
  id?: Uuid;
  raw_post_id: Uuid;
  description: string;
  category: string;
  severity: Decimal3;
  frequency?: number;
  buying_intent: Decimal3;
  clustered?: boolean;
  created_at?: string;
};

export type PainClusterInsert = {
  id?: Uuid;
  name: string;
  description: string;
  cluster_size?: number;
  opportunity_generated?: boolean;
};

export type OpportunityInsert = {
  id?: Uuid;
  cluster_id: Uuid;
  title: string;
  description: string;
  score: Decimal6;
  frequency?: number;
  severity: Decimal3;
  buying_intent: Decimal3;
  cluster_size?: number;
  recency_score?: Decimal3;
  source_diversity?: Decimal3;
  idea_generated?: boolean;
  created_at?: string;
};

export type StartupIdeaInsert = {
  id?: Uuid;
  opportunity_id: Uuid;
  problem: string;
  solution: string;
  mvp: string;
  pricing: string;
  customer?: string | null;
  distribution?: string | null;
  competitors?: string | null;
  created_at?: string;
};

export type PipelineRunInsert = {
  id?: Uuid;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  sources: number;
  raw_posts: number;
  pain_points: number;
  embeddings: number;
  clusters: number;
  opportunities: number;
  startup_ideas: number;
  average_cluster_size?: number | null;
  largest_cluster_size?: number | null;
  status: string;
  error_message?: string | null;
  created_at?: string;
};

export type PainPointEmbeddingInsert = {
  id?: Uuid;
  pain_point_id: Uuid;
  embedding: number[];
  created_at?: string;
};

export type ProfileInsert = {
  id: Uuid;
  email: string;
  name?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

// ---------------------------------------------------------------------------
// Update types (every field optional, primary key is locked)
// ---------------------------------------------------------------------------

export type SourceUpdate = Partial<Omit<SourceInsert, "id">>;
export type RawPostUpdate = Partial<Omit<RawPostInsert, "id">>;
export type PainPointUpdate = Partial<Omit<PainPointInsert, "id">>;
export type PainClusterUpdate = Partial<Omit<PainClusterInsert, "id">>;
export type OpportunityUpdate = Partial<Omit<OpportunityInsert, "id" | "cluster_id">>;
export type StartupIdeaUpdate = Partial<Omit<StartupIdeaInsert, "id" | "opportunity_id">>;
export type ProfileUpdate = Partial<Omit<ProfileInsert, "id">>;

// ---------------------------------------------------------------------------
// Database container type
// ---------------------------------------------------------------------------

type NoRelationships = [];

export interface Database {
  public: {
    Tables: {
      sources: {
        Row: SourceRow;
        Insert: SourceInsert;
        Update: SourceUpdate;
        Relationships: NoRelationships;
      };
      raw_posts: {
        Row: RawPostRow;
        Insert: RawPostInsert;
        Update: RawPostUpdate;
        Relationships: [
          {
            foreignKeyName: "raw_posts_source_id_fkey";
            columns: [];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["name"];
          },
        ];
      };
      pain_points: {
        Row: PainPointRow;
        Insert: PainPointInsert;
        Update: PainPointUpdate;
        Relationships: [];
      };
      pain_clusters: {
        Row: PainClusterRow;
        Insert: PainClusterInsert;
        Update: PainClusterUpdate;
        Relationships: NoRelationships;
      };
      opportunities: {
        Row: OpportunityRow;
        Insert: OpportunityInsert;
        Update: OpportunityUpdate;
        Relationships: [
          {
            foreignKeyName: "opportunities_cluster_id_fkey";
            columns: ["cluster_id"];
            isOneToOne: false;
            referencedRelation: "pain_clusters";
            referencedColumns: ["id"];
          },
        ];
      };
      startup_ideas: {
        Row: StartupIdeaRow;
        Insert: StartupIdeaInsert;
        Update: StartupIdeaUpdate;
        Relationships: [
          {
            foreignKeyName: "startup_ideas_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      pipeline_runs: {
        Row: PipelineRunRow;
        Insert: PipelineRunInsert;
        Update: Partial<PipelineRunInsert>;
        Relationships: NoRelationships;
      };
      pain_point_embeddings: {
        Row: PainPointEmbeddingRow;
        Insert: PainPointEmbeddingInsert;
        Update: Partial<PainPointEmbeddingInsert>;
        Relationships: [
          {
            foreignKeyName: "pain_point_embeddings_pain_point_id_fkey";
            columns: ["pain_point_id"];
            isOneToOne: false;
            referencedRelation: "pain_points";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_opportunities: {
        Row: SavedOpportunityRow;
        Insert: SavedOpportunityInsert;
        Update: Partial<SavedOpportunityInsert>;
        Relationships: [
          {
            foreignKeyName: "saved_opportunities_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_opportunities_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      watchlists: {
        Row: WatchlistRow;
        Insert: WatchlistInsert;
        Update: Partial<Omit<WatchlistInsert, "user_id">>;
        Relationships: [
          {
            foreignKeyName: "watchlists_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      alerts: {
        Row: AlertRow;
        Insert: AlertInsert;
        Update: Partial<Omit<AlertInsert, "user_id" | "watchlist_id" | "opportunity_id">>;
        Relationships: [
          {
            foreignKeyName: "alerts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alerts_watchlist_id_fkey";
            columns: ["watchlist_id"];
            isOneToOne: false;
            referencedRelation: "watchlists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alerts_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      email_notifications: {
        Row: EmailNotificationRow;
        Insert: EmailNotificationInsert;
        Update: Partial<Omit<EmailNotificationInsert, "user_id" | "alert_id">>;
        Relationships: [
          {
            foreignKeyName: "email_notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "email_notifications_alert_id_fkey";
            columns: ["alert_id"];
            isOneToOne: false;
            referencedRelation: "alerts";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_settings: {
        Row: NotificationSettingsRow;
        Insert: NotificationSettingsInsert;
        Update: Partial<NotificationSettingsUpdate>;
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: SubscriptionInsert;
        Update: Partial<SubscriptionInsert>;
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      usage_limits: {
        Row: UsageLimitRow;
        Insert: UsageLimitInsert;
        Update: UsageLimitUpdate;
        Relationships: [
          {
            foreignKeyName: "usage_limits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      weekly_digests: {
        Row: WeeklyDigestRow;
        Insert: WeeklyDigestInsert;
        Update: WeeklyDigestUpdate;
        Relationships: [
          {
            foreignKeyName: "weekly_digests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      opportunity_insights: {
        Row: OpportunityInsightRow;
        Insert: OpportunityInsightInsert;
        Update: Partial<OpportunityInsightInsert>;
        Relationships: [
          {
            foreignKeyName: "opportunity_insights_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: true;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_usage_logs: {
        Row: AiUsageLogRow;
        Insert: AiUsageLogInsert;
        Update: Partial<AiUsageLogInsert>;
        Relationships: [];
      };
      system_logs: {
        Row: SystemLogRow;
        Insert: SystemLogInsert;
        Update: Partial<SystemLogInsert>;
        Relationships: [];
      };
      opportunity_validations: {
        Row: OpportunityValidationRow;
        Insert: OpportunityValidationInsert;
        Update: OpportunityValidationUpdate;
        Relationships: [
          {
            foreignKeyName: "opportunity_validations_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: true;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      opportunity_evidence: {
        Row: OpportunityEvidenceRow;
        Insert: OpportunityEvidenceInsert;
        Update: Partial<OpportunityEvidenceInsert>;
        Relationships: [
          {
            foreignKeyName: "opportunity_evidence_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      opportunity_forecasts: {
        Row: OpportunityForecastRow;
        Insert: OpportunityForecastInsert;
        Update: Partial<OpportunityForecastInsert>;
        Relationships: [
          {
            foreignKeyName: "opportunity_forecasts_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      market_intelligence: {
        Row: MarketIntelligenceRow;
        Insert: MarketIntelligenceInsert;
        Update: Partial<MarketIntelligenceInsert>;
        Relationships: [
          {
            foreignKeyName: "market_intelligence_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      startup_scores: {
        Row: StartupScoreRow;
        Insert: StartupScoreInsert;
        Update: Partial<StartupScoreInsert>;
        Relationships: [
          {
            foreignKeyName: "startup_scores_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      venture_reports: {
        Row: VentureReportRow;
        Insert: VentureReportInsert;
        Update: Partial<VentureReportInsert>;
        Relationships: [
          {
            foreignKeyName: "venture_reports_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "venture_reports_startup_score_id_fkey";
            columns: ["startup_score_id"];
            isOneToOne: false;
            referencedRelation: "startup_scores";
            referencedColumns: ["id"];
          },
        ];
      };
      investment_memos: {
        Row: InvestmentMemoRow;
        Insert: InvestmentMemoInsert;
        Update: Partial<InvestmentMemoInsert>;
        Relationships: [
          {
            foreignKeyName: "investment_memos_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "investment_memos_venture_report_id_fkey";
            columns: ["venture_report_id"];
            isOneToOne: false;
            referencedRelation: "venture_reports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "investment_memos_investment_score_id_fkey";
            columns: ["investment_score_id"];
            isOneToOne: false;
            referencedRelation: "startup_scores";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      find_similar_pain_points: {
        Args: {
          query_embedding: number[];
          match_limit: number;
          match_threshold: number;
        };
        Returns: {
          pain_point_id: Uuid;
          similarity: number;
          description: string;
          category: string;
          severity: Decimal3;
          buying_intent: Decimal3;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

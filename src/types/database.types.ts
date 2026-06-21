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
  status: string;
  created_at: string;
};

export type PainPointEmbeddingRow = {
  id: Uuid;
  pain_point_id: Uuid;
  embedding: number[];
  created_at: string;
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
  status: string;
  created_at?: string;
};

export type PainPointEmbeddingInsert = {
  id?: Uuid;
  pain_point_id: Uuid;
  embedding: number[];
  created_at?: string;
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

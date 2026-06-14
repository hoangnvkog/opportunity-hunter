/**
 * Decimal / Uuid type aliases (back-up for future use).
 *
 * Backstory: an earlier revision of `database.types.ts` declared these to
 * document numeric column intent (Postgres `Numeric(p,s)` round-tripping as
 * string through the JS client to avoid float drift). The current Supabase
 * CLI-generated types flatten everything to `number`, so these aliases are
 * parked here pending real call-site usage.
 *
 * When to wire them in:
 *   1. Add a domain layer (e.g. `Opportunity.score: Decimal6`) above the
 *      raw `Database['public']['Tables']['opportunities']['Row']`.
 *   2. Keep the Postgres columns as `Numeric(p,s)`; cast at the boundary
 *      with helpers (to-be-written under `src/lib/db/cast.ts` or similar).
 *
 * DO NOT import these from `database.types.ts` directly until the boundary
 * helpers exist — raw `string` does not match Supabase's `number` typing
 * and will break the client's `.insert()/.update()` chains.
 *
 * Source of truth: docs/DATABASE_DESIGN.md
 */

/** Postgres `uuid` exposed to the JS client. */
export type Uuid = string;

/**
 * Numeric(4,3) — e.g. `pain_points.severity` / `pain_points.buying_intent`.
 * Stored as string to avoid JS float drift. Range: [-9.999, 9.999].
 */
export type Decimal3 = string;

/**
 * Numeric(6,3) — e.g. `opportunities.score`. Stored as string.
 * Range: [-999.999, 999.999], intended use [0, 100].
 */
export type Decimal6 = string;

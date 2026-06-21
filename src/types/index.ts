/**
 * Public type barrel for the database foundation.
 */
export * from "./database.types";
export * from "./opportunity-detail";

// Decimal types for numeric precision handling
// Re-export with explicit names to avoid conflicts with any future DB types
export type { Uuid, Decimal3, Decimal6 } from "./decimal.types";

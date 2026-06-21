import type { Uuid } from "./database.types";

export interface EmbeddingRow {
  id: Uuid;
  pain_point_id: Uuid;
  embedding: number[];
  created_at: string;
}

export interface EmbeddingInsert {
  pain_point_id: Uuid;
  embedding: number[];
}

export interface EmbeddingSearchResult {
  pain_point_id: Uuid;
  similarity: number;
  description: string;
  category: string;
  severity: string;
  buying_intent: string;
}

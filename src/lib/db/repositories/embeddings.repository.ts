import type { EmbeddingRow, EmbeddingInsert, EmbeddingSearchResult } from "@/types/embeddings";
import type { Uuid } from "@/types/database.types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AnySupabaseClient } from "./_base";

export class EmbeddingsRepository {
  private client: AnySupabaseClient;

  private constructor(client: AnySupabaseClient) {
    this.client = client;
  }

  static async create(): Promise<EmbeddingsRepository> {
    const client = await getSupabaseServerClient();
    return new EmbeddingsRepository(client);
  }

  async create(data: EmbeddingInsert): Promise<EmbeddingRow> {
    const { data: row, error } = await this.client
      .from("pain_point_embeddings")
      .insert({
        pain_point_id: data.pain_point_id,
        embedding: data.embedding,
      })
      .select()
      .single();

    if (error) throw error;
    return row as EmbeddingRow;
  }

  async createMany(data: EmbeddingInsert[]): Promise<EmbeddingRow[]> {
    if (data.length === 0) return [];

    const { data: rows, error } = await this.client
      .from("pain_point_embeddings")
      .insert(
        data.map((item) => ({
          pain_point_id: item.pain_point_id,
          embedding: item.embedding,
        }))
      )
      .select();

    if (error) throw error;
    return rows as EmbeddingRow[];
  }

  async findByPainPointId(painPointId: Uuid): Promise<EmbeddingRow | null> {
    const { data, error } = await this.client
      .from("pain_point_embeddings")
      .select("*")
      .eq("pain_point_id", painPointId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data as EmbeddingRow;
  }

  async existsByPainPointId(painPointId: Uuid): Promise<boolean> {
    const { count, error } = await this.client
      .from("pain_point_embeddings")
      .select("*", { count: "exact", head: true })
      .eq("pain_point_id", painPointId);

    if (error) throw error;
    return (count ?? 0) > 0;
  }

  async deleteByPainPointId(painPointId: Uuid): Promise<void> {
    const { error } = await this.client
      .from("pain_point_embeddings")
      .delete()
      .eq("pain_point_id", painPointId);

    if (error) throw error;
  }

  async similaritySearch(
    queryEmbedding: number[],
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<EmbeddingSearchResult[]> {
    const { data, error } = await this.client.rpc("find_similar_pain_points", {
      query_embedding: queryEmbedding,
      match_limit: limit,
      match_threshold: threshold,
    });

    if (error) throw error;
    return data as EmbeddingSearchResult[];
  }

  async count(): Promise<number> {
    const { count, error } = await this.client
      .from("pain_point_embeddings")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return count ?? 0;
  }
}

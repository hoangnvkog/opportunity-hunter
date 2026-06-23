import type { SavedOpportunityRow } from "@/types/saved-opportunity";
import type { Uuid } from "@/types";
import { RepositoryError, translateError } from "@/lib/db/errors";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";

const ENTITY = "saved_opportunities";

export class SavedOpportunitiesRepository {
  constructor(private readonly client: AnySupabaseClient) {}

  static async create(): Promise<SavedOpportunitiesRepository> {
    const { getSupabaseServerClient } = await import("@/lib/supabase");
    return new SavedOpportunitiesRepository(await getSupabaseServerClient());
  }

  /**
   * Save an opportunity for a user
   */
  async save(userId: Uuid, opportunityId: Uuid): Promise<SavedOpportunityRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert({ user_id: userId, opportunity_id: opportunityId })
      .select()
      .single();

    if (error) throw translateError(ENTITY, error);
    if (!data) throw new RepositoryError(`${ENTITY} insert returned no row`);
    return data;
  }

  /**
   * Unsave an opportunity for a user
   */
  async unsave(userId: Uuid, opportunityId: Uuid): Promise<void> {
    const { error } = await this.client
      .from(ENTITY)
      .delete()
      .eq("user_id", userId)
      .eq("opportunity_id", opportunityId);

    if (error) throw translateError(ENTITY, error);
  }

  /**
   * Check if an opportunity is saved by a user
   */
  async isSaved(userId: Uuid, opportunityId: Uuid): Promise<boolean> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("id")
      .eq("user_id", userId)
      .eq("opportunity_id", opportunityId)
      .maybeSingle();

    if (error) throw translateError(ENTITY, error);
    return !!data;
  }

  /**
   * Get all saved opportunity IDs for a user (newest first)
   */
  async listSaved(userId: Uuid): Promise<SavedOpportunityRow[]> {
    const { data, error } = await this.client
      .from(ENTITY)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw translateError(ENTITY, error);
    return data ?? [];
  }

  /**
   * Count saved opportunities for a user
   */
  async countSaved(userId: Uuid): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }

  async countAll(): Promise<number> {
    const { count, error } = await this.client
      .from(ENTITY)
      .select("*", { count: "exact", head: true });

    if (error) throw translateError(ENTITY, error);
    return count ?? 0;
  }
}

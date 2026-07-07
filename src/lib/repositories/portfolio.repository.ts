// Sprint 60: Portfolio Intelligence Engine - Repository

import { getSupabaseServiceClient } from "@/lib/supabase";
import type {
  PortfolioItemRow,
  PortfolioItemInput,
  PortfolioCard,
  PortfolioStatistics,
  PortfolioFilters,
  PortfolioSort,
  PortfolioStatus,
  Priority,
} from "@/types/portfolio";
import type { Database } from "@/types/database.types";

// Type for portfolio item with joined opportunities and related tables
interface PortfolioItemWithRelations extends PortfolioItemRow {
  opportunities: Database["public"]["Tables"]["opportunities"]["Row"] & {
    startup_scores?: Array<{ overall_score: number }>;
    opportunity_backtests?: Array<{ accuracy_score: number }>;
    pain_clusters?: Array<{ trend_score: number }>;
    opportunity_forecasts?: Array<{ growth_projection: number }>;
    opportunity_validations?: Array<{ overall_score: number }>;
  };
}

export class PortfolioRepository {
  // ==========================================
  // CREATE
  // ==========================================

  async create(input: PortfolioItemInput): Promise<PortfolioItemRow> {
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from("portfolio_items")
      .insert({
        opportunity_id: input.opportunity_id,
        status: input.status || "WATCHLIST",
        priority: input.priority || "MEDIUM",
        health_score: input.health_score,
        watch_score: input.watch_score,
        favorite: input.favorite || false,
        archived: input.archived || false,
        notes: input.notes,
        last_reviewed_at: input.last_reviewed_at,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==========================================
  // UPDATE
  // ==========================================

  async update(
    id: string,
    updates: Partial<Omit<PortfolioItemInput, "opportunity_id">>,
  ): Promise<PortfolioItemRow> {
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from("portfolio_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==========================================
  // ARCHIVE
  // ==========================================

  async archive(id: string): Promise<PortfolioItemRow> {
    return this.update(id, { archived: true });
  }

  async unarchive(id: string): Promise<PortfolioItemRow> {
    return this.update(id, { archived: false });
  }

  // ==========================================
  // FAVORITE
  // ==========================================

  async toggleFavorite(id: string): Promise<PortfolioItemRow> {
    const current = await this.findById(id);
    if (!current) throw new Error("Portfolio item not found");

    return this.update(id, { favorite: !current.favorite });
  }

  // ==========================================
  // STATUS
  // ==========================================

  async changeStatus(
    id: string,
    status: PortfolioStatus,
  ): Promise<PortfolioItemRow> {
    return this.update(id, { status });
  }

  // ==========================================
  // PRIORITY
  // ==========================================

  async changePriority(
    id: string,
    priority: Priority,
  ): Promise<PortfolioItemRow> {
    return this.update(id, { priority });
  }

  // ==========================================
  // REVIEW
  // ==========================================

  async markReviewed(id: string, notes?: string): Promise<PortfolioItemRow> {
    return this.update(id, {
      last_reviewed_at: new Date().toISOString(),
      notes,
    });
  }

  // ==========================================
  // FIND BY ID
  // ==========================================

  async findById(id: string): Promise<PortfolioItemRow | null> {
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from("portfolio_items")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  }

  // ==========================================
  // FIND BY OPPORTUNITY
  // ==========================================

  async findByOpportunity(
    opportunity_id: string,
  ): Promise<PortfolioItemRow | null> {
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from("portfolio_items")
      .select("*")
      .eq("opportunity_id", opportunity_id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  }

  // ==========================================
  // LIST
  // ==========================================

  async list(
    filters?: PortfolioFilters,
    sort?: PortfolioSort,
    limit?: number,
    offset?: number,
  ): Promise<PortfolioItemRow[]> {
    const supabase = getSupabaseServiceClient();

    let query = supabase.from("portfolio_items").select("*");

    // Filters
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in("status", filters.status);
      } else {
        query = query.eq("status", filters.status);
      }
    }

    if (filters?.priority) {
      if (Array.isArray(filters.priority)) {
        query = query.in("priority", filters.priority);
      } else {
        query = query.eq("priority", filters.priority);
      }
    }

    if (filters?.favorite !== undefined) {
      query = query.eq("favorite", filters.favorite);
    }

    if (filters?.archived !== undefined) {
      query = query.eq("archived", filters.archived);
    }

    if (filters?.min_health !== undefined) {
      query = query.gte("health_score", filters.min_health);
    }

    if (filters?.max_health !== undefined) {
      query = query.lte("health_score", filters.max_health);
    }

    if (filters?.needs_review) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.or(
        `last_reviewed_at.is.null,last_reviewed_at.lt.${thirtyDaysAgo.toISOString()}`,
      );
    }

    // Sort
    if (sort) {
      query = query.order(sort.field, { ascending: sort.direction === "asc" });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // Pagination
    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 10) - 1);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // ==========================================
  // COUNT
  // ==========================================

  async count(filters?: PortfolioFilters): Promise<number> {
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from("portfolio_items")
      .select("*", { count: "exact", head: true });

    // Apply same filters as list
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in("status", filters.status);
      } else {
        query = query.eq("status", filters.status);
      }
    }

    if (filters?.priority) {
      if (Array.isArray(filters.priority)) {
        query = query.in("priority", filters.priority);
      } else {
        query = query.eq("priority", filters.priority);
      }
    }

    if (filters?.favorite !== undefined) {
      query = query.eq("favorite", filters.favorite);
    }

    if (filters?.archived !== undefined) {
      query = query.eq("archived", filters.archived);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }

  // ==========================================
  // LIST CARDS (with enriched data)
  // ==========================================

  async listCards(
    filters?: PortfolioFilters,
    sort?: PortfolioSort,
    limit?: number,
    offset?: number,
  ): Promise<PortfolioCard[]> {
    const supabase = getSupabaseServiceClient();

    let query = supabase.from("portfolio_items").select(`
        *,
        opportunities!inner(
          id,
          title,
          startup_scores(overall_score),
          opportunity_backtests(accuracy_score),
          pain_clusters(trend_score),
          opportunity_forecasts(growth_projection),
          opportunity_validations(overall_score)
        )
      `);

    // Apply filters
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in("status", filters.status);
      } else {
        query = query.eq("status", filters.status);
      }
    }

    if (filters?.priority) {
      if (Array.isArray(filters.priority)) {
        query = query.in("priority", filters.priority);
      } else {
        query = query.eq("priority", filters.priority);
      }
    }

    if (filters?.favorite !== undefined) {
      query = query.eq("favorite", filters.favorite);
    }

    if (filters?.archived !== undefined) {
      query = query.eq("archived", filters.archived);
    }

    if (filters?.min_health !== undefined) {
      query = query.gte("health_score", filters.min_health);
    }

    if (filters?.max_health !== undefined) {
      query = query.lte("health_score", filters.max_health);
    }

    if (filters?.needs_review) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.or(
        `last_reviewed_at.is.null,last_reviewed_at.lt.${thirtyDaysAgo.toISOString()}`,
      );
    }

    if (filters?.search) {
      query = query.ilike("opportunities.title", `%${filters.search}%`);
    }

    // Sort
    if (sort) {
      query = query.order(sort.field, { ascending: sort.direction === "asc" });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // Pagination
    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 10) - 1);

    // Apply typed return at the end
    const { data, error } = await query.returns<PortfolioItemWithRelations[]>();
    if (error) throw error;

    // Map to PortfolioCard
    return (data || []).map((item: PortfolioItemWithRelations) => ({
      id: item.id,
      opportunity_id: item.opportunity_id,
      opportunity_title: item.opportunities?.title || "Unknown",
      status: item.status,
      priority: item.priority,
      health_score: item.health_score,
      watch_score: item.watch_score,
      favorite: item.favorite,
      archived: item.archived,
      notes: item.notes,
      last_reviewed_at: item.last_reviewed_at,
      created_at: item.created_at,
      updated_at: item.updated_at,
      investment_score: item.opportunities?.startup_scores?.[0]?.overall_score,
      backtesting_accuracy:
        item.opportunities?.opportunity_backtests?.[0]?.accuracy_score,
      trend_score: item.opportunities?.pain_clusters?.[0]?.trend_score,
      forecast_growth:
        item.opportunities?.opportunity_forecasts?.[0]?.growth_projection,
      validation_score:
        item.opportunities?.opportunity_validations?.[0]?.overall_score,
    }));
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  async statistics(): Promise<PortfolioStatistics> {
    const supabase = getSupabaseServiceClient();

    // Get all items (not archived)
    const { data: items, error } = await supabase
      .from("portfolio_items")
      .select(
        "status, priority, health_score, favorite, archived, last_reviewed_at",
      )
      .eq("archived", false)
      .returns<
        Pick<
          PortfolioItemRow,
          | "status"
          | "priority"
          | "health_score"
          | "favorite"
          | "archived"
          | "last_reviewed_at"
        >[]
      >();

    if (error) throw error;

    const all = items || [];

    // By status
    const byStatus: Record<PortfolioStatus, number> = {
      WATCHLIST: 0,
      RESEARCHING: 0,
      VALIDATED: 0,
      BUILDING: 0,
      INVESTED: 0,
      ARCHIVED: 0,
    };
    all.forEach((item) => {
      byStatus[item.status as PortfolioStatus] =
        (byStatus[item.status as PortfolioStatus] || 0) + 1;
    });

    // By priority
    const byPriority: Record<Priority, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    all.forEach((item) => {
      byPriority[item.priority as Priority] =
        (byPriority[item.priority as Priority] || 0) + 1;
    });

    // By health
    const byHealth = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      unscored: 0,
    };
    all.forEach((item) => {
      if (item.health_score === null || item.health_score === undefined) {
        byHealth.unscored++;
      } else if (item.health_score >= 90) {
        byHealth.excellent++;
      } else if (item.health_score >= 70) {
        byHealth.good++;
      } else if (item.health_score >= 50) {
        byHealth.fair++;
      } else {
        byHealth.poor++;
      }
    });

    // Average health
    const scored = all.filter(
      (item) => item.health_score !== null && item.health_score !== undefined,
    );
    const averageHealth =
      scored.length > 0
        ? scored.reduce(
            (sum: number, item) => sum + (item.health_score ?? 0),
            0,
          ) / scored.length
        : null;

    // Needs review (>30 days or never)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const needsReview = all.filter(
      (item) =>
        !item.last_reviewed_at ||
        new Date(item.last_reviewed_at) < thirtyDaysAgo,
    ).length;

    // Favorites
    const favorites = all.filter((item) => item.favorite).length;

    // Archived count
    const { count: archivedCount } = await supabase
      .from("portfolio_items")
      .select("*", { count: "exact", head: true })
      .eq("archived", true);

    return {
      total_items: all.length,
      by_status: byStatus,
      by_priority: byPriority,
      by_health: byHealth,
      favorites,
      archived: archivedCount || 0,
      average_health: averageHealth,
      needs_review: needsReview,
    };
  }

  // ==========================================
  // DELETE
  // ==========================================

  async delete(id: string): Promise<void> {
    const supabase = getSupabaseServiceClient();

    const { error } = await supabase
      .from("portfolio_items")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}

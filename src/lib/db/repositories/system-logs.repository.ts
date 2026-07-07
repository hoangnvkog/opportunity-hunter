import type { SystemLogRow, SystemLogInsert, LogLevel } from "@/types/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import type { AnySupabaseClient } from "@/lib/db/repositories/_base";
import { translateError } from "@/lib/db/errors";

const ENTITY = "system_logs";

export class SystemLogsRepository {
  private readonly client: AnySupabaseClient;

  constructor(client: AnySupabaseClient) {
    this.client = client;
  }

  static async create(): Promise<SystemLogsRepository> {
    return new SystemLogsRepository(getSupabaseServiceClient());
  }

  async insert(log: SystemLogInsert): Promise<SystemLogRow> {
    const { data, error } = await this.client
      .from(ENTITY)
      .insert(log)
      .select()
      .single();

    if (error) {
      throw translateError(ENTITY, error);
    }
    return data;
  }

  async findAll(
    options: {
      level?: LogLevel;
      limit?: number;
      offset?: number;
      search?: string;
    } = {},
  ): Promise<{ logs: SystemLogRow[]; total: number }> {
    let query = this.client.from(ENTITY).select("*", { count: "exact" });

    if (options.level) {
      query = query.eq("level", options.level);
    }

    if (options.search) {
      query = query.ilike("message", `%${options.search}%`);
    }

    query = query
      .order("created_at", { ascending: false })
      .range(
        options.offset ?? 0,
        (options.offset ?? 0) + (options.limit ?? 50) - 1,
      );

    const { data, error } = await query;

    if (error) {
      throw translateError(ENTITY, error);
    }

    return { logs: data ?? [], total: data?.length ?? 0 };
  }

  async countByLevel(): Promise<Record<LogLevel, number>> {
    const { data, error } = await this.client.from(ENTITY).select("level");

    if (error) {
      throw translateError(ENTITY, error);
    }

    const counts: Record<LogLevel, number> = {
      info: 0,
      warn: 0,
      error: 0,
      debug: 0,
    };
    for (const row of data ?? []) {
      if (row.level in counts) {
        counts[row.level as LogLevel]++;
      }
    }
    return counts;
  }

  async countLast24h(): Promise<{ errors: number; warnings: number }> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await this.client
      .from(ENTITY)
      .select("level")
      .gte("created_at", since);

    if (error) {
      throw translateError(ENTITY, error);
    }

    let errors = 0;
    let warnings = 0;
    for (const row of data ?? []) {
      if (row.level === "error") errors++;
      else if (row.level === "warn") warnings++;
    }
    return { errors, warnings };
  }

  async deleteOlderThan(days: number): Promise<number> {
    const cutoff = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { error, count } = await this.client
      .from(ENTITY)
      .delete()
      .lt("created_at", cutoff);

    if (error) {
      throw translateError(ENTITY, error);
    }
    return count ?? 0;
  }
}

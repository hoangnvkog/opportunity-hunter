import { SystemLogsRepository } from "@/lib/db/repositories/system-logs.repository";
import { AiUsageRepository } from "@/lib/db/repositories/ai-usage.repository";
import { PipelineRunsRepository } from "@/lib/db/repositories/pipeline-runs.repository";
import type { SystemHealth } from "@/types/analytics";

export class MonitoringService {
  private systemLogsRepo: SystemLogsRepository;
  private aiUsageRepo: AiUsageRepository;
  private pipelineRunsRepo: PipelineRunsRepository;

  constructor(
    systemLogsRepo: SystemLogsRepository,
    aiUsageRepo: AiUsageRepository,
    pipelineRunsRepo: PipelineRunsRepository,
  ) {
    this.systemLogsRepo = systemLogsRepo;
    this.aiUsageRepo = aiUsageRepo;
    this.pipelineRunsRepo = pipelineRunsRepo;
  }

  static async create(): Promise<MonitoringService> {
    const [systemLogsRepo, aiUsageRepo, pipelineRunsRepo] = await Promise.all([
      SystemLogsRepository.create(),
      AiUsageRepository.create(),
      PipelineRunsRepository.create(),
    ]);
    return new MonitoringService(systemLogsRepo, aiUsageRepo, pipelineRunsRepo);
  }

  async log(level: LogLevel, message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.systemLogsRepo.insert({ level, message, metadata });
  }

  async info(message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log("info", message, metadata);
  }

  async warn(message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log("warn", message, metadata);
  }

  async error(message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log("error", message, metadata);
  }

  async debug(message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log("debug", message, metadata);
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const health = await this.systemLogsRepo.countLast24h();
    const pipelineRuns = await this.pipelineRunsRepo.findRecent(5);
    const recentFailures = pipelineRuns.filter((r) => r.status === "failed").length;

    let status: SystemHealth["status"] = "healthy";
    if (health.errors > 10 || health.warnings > 50 || recentFailures > 0) {
      status = "degraded";
    }
    if (health.errors > 50 || recentFailures > 2) {
      status = "down";
    }

    return {
      status,
      errorsLast24h: health.errors,
      warningsLast24h: health.warnings,
      avgResponseTime: null,
    };
  }

  async cleanOldLogs(days = 30): Promise<number> {
    return this.systemLogsRepo.deleteOlderThan(days);
  }

  async getHealthTrend(
    days = 7
  ): Promise<{ date: string; errors: number; warnings: number }[]> {
    const trend: { date: string; errors: number; warnings: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      const health = await this.systemLogsRepo.countLast24h();
      trend.push({ date, errors: health.errors, warnings: health.warnings });
    }

    return trend;
  }
}
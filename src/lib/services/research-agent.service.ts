/**
 * Sprint 62: Autonomous Research Agent
 *
 * Service for managing research jobs and sources.
 * Orchestrates: starting jobs, running sources, executing pipeline, storing results.
 */

import { ResearchJobsRepository } from "@/lib/db/repositories/research-job.repository";
import { ResearchSourcesRepository } from "@/lib/db/repositories/research-sources.repository";
import { ResearchLogsRepository } from "@/lib/db/repositories/research-logs.repository";
import { RawPostsRepository } from "@/lib/db/repositories/raw-posts.repository";
import type {
  ResearchJobRow,
  ResearchSourceRow,
  ResearchLogRow,
  ResearchSourceName,
  ResearchJobStatus,
} from "@/types/research-job";
import type { RawPostRow } from "@/types/database.types";
import { RedditAdapter } from "@/lib/research/adapters/reddit.adapter";
import { GithubAdapter } from "@/lib/research/adapters/github.adapter";
import { HackerNewsAdapter } from "@/lib/research/adapters/hackernews.adapter";
import { ProductHuntAdapter } from "@/lib/research/adapters/producthunt.adapter";
import { RssAdapter } from "@/lib/research/adapters/rss.adapter";
import type { ResearchSourceAdapter } from "@/lib/research/adapters/base.adapter";

const jobsRepo = new ResearchJobsRepository();
const sourcesRepo = new ResearchSourcesRepository();
const logsRepo = new ResearchLogsRepository();

/** Valid source names */
const VALID_SOURCES: ResearchSourceName[] = [
  "reddit", "github", "hackernews", "producthunt", "rss",
];

/** Map of source names to adapter instances. */
const adapterMap: Record<ResearchSourceName, ResearchSourceAdapter> = {
  reddit: new RedditAdapter(),
  github: new GithubAdapter(),
  hackernews: new HackerNewsAdapter(),
  producthunt: new ProductHuntAdapter(),
  rss: new RssAdapter(),
};

/**
 * Start a new research job for a given source.
 */
export async function startResearch(source: ResearchSourceName): Promise<ResearchJobRow> {
  if (!VALID_SOURCES.includes(source)) {
    throw new Error(`Invalid source: ${source}. Must be one of: ${VALID_SOURCES.join(", ")}`);
  }

  const job = await jobsRepo.create({
    source,
    status: "pending",
    items_found: 0,
    items_processed: 0,
  });

  await logsRepo.create({
    job_id: job.id,
    stage: "collect",
    message: `Research job started for source: ${source}`,
    level: "info",
  });

  await jobsRepo.update(job.id, { status: "running", started_at: new Date().toISOString() });
  await logsRepo.create({
    job_id: job.id,
    stage: "collect",
    message: "Job status updated to running",
    level: "info",
  });

  // Start processing in background (fire-and-forget)
  processJob(job.id).catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Research job ${job.id} failed:`, msg);
    jobsRepo.update(job.id, { status: "failed", finished_at: new Date().toISOString() });
    logsRepo.create({
      job_id: job.id,
      stage: "collect",
      message: `Job failed: ${msg}`,
      level: "error",
    });
  });

  return { ...job, status: "running" as ResearchJobStatus };
}

/**
 * Process a research job: iterate sources, collect data, run pipeline.
 */
async function processJob(jobId: string): Promise<void> {
  let totalFound = 0;
  let totalProcessed = 0;

  try {
    const rawPostsRepo = await RawPostsRepository.create();
    const job = await jobsRepo.findById(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    // Determine which sources to process
    let sourcesToProcess: ResearchSourceRow[] = [];
    const source = await sourcesRepo.findByName(job.source as ResearchSourceName);
    if (source) {
      sourcesToProcess = [source];
    } else {
      throw new Error(`Source ${job.source} not found in research_sources table`);
    }

    // Process each source
    for (const src of sourcesToProcess) {
      await sourcesRepo.update(src.id, { last_sync: new Date().toISOString() });

      await logsRepo.create({
        job_id: jobId,
        stage: "collect",
        message: `Processing source: ${src.name}`,
        level: "info",
      });

      const adapter = adapterMap[src.name];
      if (!adapter) {
        await logsRepo.create({
          job_id: jobId,
          stage: "collect",
          message: `No adapter found for source: ${src.name}`,
          level: "error",
        });
        continue;
      }

      const isHealthy = await adapter.health();
      if (!isHealthy) {
        await logsRepo.create({
          job_id: jobId,
          stage: "collect",
          message: `Source ${src.name} is unhealthy, skipping`,
          level: "warn",
        });
        continue;
      }

      const rawPosts: RawPostRow[] = await adapter.collect();
      await logsRepo.create({
        job_id: jobId,
        stage: "collect",
        message: `Collected ${rawPosts.length} items from ${src.name}`,
        level: "info",
      });

      totalFound += rawPosts.length;

      if (rawPosts.length > 0) {
        await rawPostsRepo.createMany(rawPosts);
        totalProcessed += rawPosts.length;
        await logsRepo.create({
          job_id: jobId,
          stage: "pain",
          message: `Inserted ${rawPosts.length} items from ${src.name} into raw_posts`,
          level: "info",
        });
      }
    }

    // Mark as completed
    await jobsRepo.update(jobId, {
      status: "completed",
      finished_at: new Date().toISOString(),
      items_found: totalFound,
      items_processed: totalProcessed,
    });

    await logsRepo.create({
      job_id: jobId,
      stage: "store_results",
      message: `Job completed. Found: ${totalFound}, Processed: ${totalProcessed}`,
      level: "info",
    });
  } catch (error) {
    await jobsRepo.update(jobId, { status: "failed", finished_at: new Date().toISOString() });
    const msg = error instanceof Error ? error.message : String(error);
    await logsRepo.create({
      job_id: jobId,
      stage: "collect",
      message: `Job processing failed: ${msg}`,
      level: "error",
    });
    throw error;
  }
}

/**
 * Get the status of a research job.
 */
export async function getJobStatus(jobId: string): Promise<ResearchJobRow | null> {
  return await jobsRepo.findById(jobId);
}

/**
 * List research jobs with optional filtering.
 */
export async function listResearchJobs(filters?: {
  status?: ResearchJobStatus;
  source?: ResearchSourceName;
  limit?: number;
  offset?: number;
}): Promise<ResearchJobRow[]> {
  return await jobsRepo.list(filters);
}

/**
 * Cancel a running research job.
 */
export async function cancelJob(jobId: string): Promise<void> {
  const job = await jobsRepo.findById(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);
  if (job.status !== "running") {
    throw new Error(`Job ${jobId} is not running (status: ${job.status})`);
  }
  await jobsRepo.update(jobId, { status: "cancelled", finished_at: new Date().toISOString() });
  await logsRepo.create({
    job_id: jobId,
    stage: "collect",
    message: "Job cancelled by user",
    level: "warn",
  });
}

/**
 * Get a job with its logs.
 */
export async function getJobWithLogs(jobId: string): Promise<{
  job: ResearchJobRow | null;
  logs: ResearchLogRow[];
}> {
  const [job, logs] = await Promise.all([
    jobsRepo.findById(jobId),
    logsRepo.findByJobId(jobId),
  ]);
  return { job, logs: logs ?? [] };
}

/**
 * Get research statistics.
 */
export async function getResearchStats() {
  const [total, pending, running, completed, failed, cancelled] = await Promise.all([
    jobsRepo.count(),
    jobsRepo.count({ status: "pending" }),
    jobsRepo.count({ status: "running" }),
    jobsRepo.count({ status: "completed" }),
    jobsRepo.count({ status: "failed" }),
    jobsRepo.count({ status: "cancelled" }),
  ]);

  const completedJobs = await jobsRepo.list({ status: "completed", limit: 1000 });

  let totalDurationMs = 0;
  let countWithDuration = 0;
  let totalItemsFound = 0;
  let totalItemsProcessed = 0;

  for (const j of completedJobs) {
    if (j.started_at && j.finished_at) {
      const duration = new Date(j.finished_at).getTime() - new Date(j.started_at).getTime();
      if (!isNaN(duration)) {
        totalDurationMs += duration;
        countWithDuration++;
      }
    }
    totalItemsFound += j.items_found;
    totalItemsProcessed += j.items_processed;
  }

  const averageDurationMs = countWithDuration > 0 ? Math.floor(totalDurationMs / countWithDuration) : 0;
  const successRate = total > 0 ? (completed / total) * 100 : 0;

  return {
    total, pending, running, completed, failed, cancelled,
    successRate: parseFloat(successRate.toFixed(2)),
    averageDurationMs,
    totalItemsFound,
    totalItemsProcessed,
  };
}

/**
 * Get logs for a job.
 */
export async function getJobLogs(jobId: string): Promise<ResearchLogRow[]> {
  return await logsRepo.findByJobId(jobId);
}

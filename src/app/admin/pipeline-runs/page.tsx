import { PipelineRunsRepository } from "@/lib/db/repositories/pipeline-runs.repository";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function PipelineRunsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const repo = await PipelineRunsRepository.create();
  const { runs, total } = await repo.list({ limit: PAGE_SIZE, offset });
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pipeline Run History</h1>
          <p className="text-muted-foreground mt-1">
            {total} total runs
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-md border px-4 py-2 text-sm hover:bg-secondary"
        >
          ← Back to Admin
        </Link>
      </div>

      {runs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No pipeline runs recorded yet.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {runs.map((run) => (
              <RunRow key={run.id} run={run} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/pipeline-runs?page=${page - 1}`}
                  className="rounded-md border px-4 py-2 text-sm hover:bg-secondary"
                >
                  Previous
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/admin/pipeline-runs?page=${page + 1}`}
                  className="rounded-md border px-4 py-2 text-sm hover:bg-secondary"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RunRow({ run }: { run: { id: string; started_at: string; finished_at: string; duration_ms: number; status: string; error_message: string | null; raw_posts: number; pain_points: number; clusters: number; opportunities: number; startup_ideas: number } }) {
  const statusColor =
    run.status === "success"
      ? "bg-green-100 text-green-800"
      : run.status === "failed"
        ? "bg-red-100 text-red-800"
        : "bg-yellow-100 text-yellow-800";

  const statusIcon =
    run.status === "success" ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : run.status === "failed" ? (
      <AlertCircle className="h-4 w-4 text-red-500" />
    ) : (
      <Clock className="h-4 w-4 text-yellow-500" />
    );

  const durationSec = run.duration_ms / 1000;
  const durationStr = durationSec < 60
    ? `${durationSec.toFixed(1)}s`
    : `${Math.floor(durationSec / 60)}m ${(durationSec % 60).toFixed(0)}s`;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {statusIcon}
            <Badge className={statusColor}>{run.status.toUpperCase()}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date(run.started_at).toLocaleString()}
            <span className="ml-2">({durationStr})</span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 mt-4 text-center">
          <div>
            <p className="text-lg font-bold">{run.raw_posts}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <div>
            <p className="text-lg font-bold">{run.pain_points}</p>
            <p className="text-xs text-muted-foreground">Pain Points</p>
          </div>
          <div>
            <p className="text-lg font-bold">{run.clusters}</p>
            <p className="text-xs text-muted-foreground">Clusters</p>
          </div>
          <div>
            <p className="text-lg font-bold">{run.opportunities}</p>
            <p className="text-xs text-muted-foreground">Opportunities</p>
          </div>
          <div>
            <p className="text-lg font-bold">{run.startup_ideas}</p>
            <p className="text-xs text-muted-foreground">Ideas</p>
          </div>
        </div>

        {run.error_message && (
          <p className="text-sm text-red-600 mt-3 bg-red-50 border border-red-200 rounded-md p-2">
            {run.error_message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

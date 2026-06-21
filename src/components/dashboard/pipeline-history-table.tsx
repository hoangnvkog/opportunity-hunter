import { Badge } from "@/components/ui/Badge";
import type { PipelineRunHistory } from "@/types/pipeline-run-history";

interface PipelineHistoryTableProps {
  runs: PipelineRunHistory[];
}

export function PipelineHistoryTable({ runs }: PipelineHistoryTableProps) {
  if (runs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No pipeline runs yet.
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Started At</th>
              <th className="text-left p-3 font-medium">Duration</th>
              <th className="text-center p-3 font-medium">Sources</th>
              <th className="text-center p-3 font-medium">Raw Posts</th>
              <th className="text-center p-3 font-medium">Pain Points</th>
              <th className="text-center p-3 font-medium">Embeddings</th>
              <th className="text-center p-3 font-medium">Clusters</th>
              <th className="text-center p-3 font-medium">Opportunities</th>
              <th className="text-center p-3 font-medium">Startup Ideas</th>
              <th className="text-center p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id} className="border-t hover:bg-muted/30">
                <td className="p-3">{formatDate(run.started_at)}</td>
                <td className="p-3">{formatDuration(run.duration_ms)}</td>
                <td className="p-3 text-center">{run.sources}</td>
                <td className="p-3 text-center">{run.raw_posts}</td>
                <td className="p-3 text-center">{run.pain_points}</td>
                <td className="p-3 text-center">{run.embeddings}</td>
                <td className="p-3 text-center">{run.clusters}</td>
                <td className="p-3 text-center">{run.opportunities}</td>
                <td className="p-3 text-center">{run.startup_ideas}</td>
                <td className="p-3 text-center">
                  <Badge
                    variant={run.status === "success" ? "default" : "destructive"}
                  >
                    {run.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PipelineHistoryTable } from "./pipeline-history-table";
import type { PipelineRunHistory } from "@/types/pipeline-run-history";

interface PipelineHistorySectionProps {
  runs: PipelineRunHistory[];
}

export function PipelineHistorySection({ runs }: PipelineHistorySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline History</CardTitle>
      </CardHeader>
      <CardContent>
        <PipelineHistoryTable runs={runs} />
      </CardContent>
    </Card>
  );
}

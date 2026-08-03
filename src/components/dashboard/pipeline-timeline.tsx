/**
 * Visual pipeline timeline — shows how many items flowed through each stage
 * of the most recent pipeline run, and surfaces the overall run status.
 */
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Activity, ArrowRight, AlertCircle } from "lucide-react";
import type { PipelineRunHistory } from "@/types/pipeline-run-history";

interface PipelineTimelineProps {
  run: PipelineRunHistory | null;
}

interface Stage {
  key: string;
  label: string;
  value: number;
}

export function PipelineTimeline({ run }: PipelineTimelineProps) {
  if (!run) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            AI Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Activity className="h-5 w-5" />}
            title="Chưa có lần chạy pipeline"
            description="Bấm Chạy pipeline trên thanh trên cùng để bắt đầu quét thị trường."
            action={{ label: "Chạy ngay", href: "/dashboard" }}
          />
        </CardContent>
      </Card>
    );
  }

  const stages: Stage[] = [
    { key: "raw_posts", label: "Raw posts", value: run.raw_posts },
    { key: "pain_points", label: "Pain points", value: run.pain_points },
    { key: "embeddings", label: "Vector", value: run.embeddings },
    { key: "clusters", label: "Cụm", value: run.clusters },
    { key: "opportunities", label: "Cơ hội", value: run.opportunities },
    { key: "startup_ideas", label: "Ý tưởng", value: run.startup_ideas },
  ];

  const started = new Date(run.started_at);
  const duration = (run.duration_ms / 1000).toFixed(1);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            AI Pipeline
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {started.toLocaleString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "2-digit",
            })}{" "}
            · {duration}s · {run.sources} nguồn
          </p>
        </div>
        <Badge variant={statusVariant(run.status)}>
          {run.status === "running"
            ? "Đang chạy"
            : run.status === "failed"
              ? "Thất bại"
              : "Thành công"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {stages.map((stage, i) => (
            <div key={stage.key} className="relative">
              <div className="rounded-lg border bg-card p-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {stage.label}
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums">
                  {stage.value}
                </p>
              </div>
              {i < stages.length - 1 && (
                <ArrowRight className="absolute right-[-14px] top-1/2 hidden h-3 w-3 -translate-y-1/2 text-muted-foreground/60 sm:block" />
              )}
            </div>
          ))}
        </div>
        {run.error_message && (
          <p className="flex items-start gap-2 rounded-md border border-signal-risk/30 bg-signal-risk-soft/40 p-2 text-xs text-signal-risk-foreground">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-2">{run.error_message}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
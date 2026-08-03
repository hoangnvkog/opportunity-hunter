"use client";

import { useEffect, useState } from "react";
import { Activity, Play, Target, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, statusVariant } from "@/components/ui/badge";
import { runPipelineAction, getLatestPipelineRunAction } from "@/actions/pipeline.actions";
import Link from "next/link";

interface HeroIntelligenceStripProps {
  weeklyOpportunities: number;
  validatedCount: number;
  topScore: number;
}

interface PipelineSnapshot {
  lastRun: string | null;
  lastStatus: string | null;
  opportunities: number;
  ideas: number;
}

/**
 * Hero strip at the top of the dashboard — the "command center" line.
 * Shows pipeline health + run-now + opportunity headline stats.
 */
export function HeroIntelligenceStrip({
  weeklyOpportunities,
  validatedCount,
  topScore,
}: HeroIntelligenceStripProps) {
  const [snapshot, setSnapshot] = useState<PipelineSnapshot | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchStatus = async () => {
      try {
        const data = await getLatestPipelineRunAction();
        if (cancelled) return;
        if (data) setSnapshot(data);
      } catch {
        /* ignore */
      }
    };
    fetchStatus();
    const id = setInterval(fetchStatus, 10_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const handleRun = async () => {
    setRunning(true);
    setMessage(null);
    setError(null);
    try {
      const result = await runPipelineAction();
      if (result.success && result.result) {
        setMessage(`Pipeline xong — tạo ${result.result.opportunities} cơ hội.`);
        setSnapshot({
          lastRun: result.result.finishedAt,
          lastStatus: result.result.success ? "success" : "failed",
          opportunities: result.result.opportunities,
          ideas: result.result.ideas,
        });
      } else {
        setError(result.error || "Chạy pipeline thất bại");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setRunning(false);
    }
  };

  const status = snapshot?.lastStatus ?? null;
  const statusLabel =
    status === "running"
      ? "Pipeline đang chạy"
      : status === "failed"
        ? "Pipeline lỗi"
        : status === "success"
          ? "Pipeline ổn"
          : "Pipeline chờ";

  return (
    <Card className="overflow-hidden border-border/60">
      <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2">
              <span
                className={`absolute inline-flex h-2 w-2 rounded-full ${
                  status === "running"
                    ? "bg-signal-info radar-pulse"
                    : status === "failed"
                      ? "bg-signal-risk"
                      : "bg-signal-hot"
                }`}
              />
            </span>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Opportunity Radar
            </p>
            <Badge variant={statusVariant(status)} className="ml-1">
              <Activity className="h-3 w-3" />
              {statusLabel}
            </Badge>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Hệ thống đã quét{" "}
              <span className="text-primary tabular-nums">{weeklyOpportunities}</span>{" "}
              cơ hội mới trong 7 ngày qua
            </h2>
            <p className="text-sm text-muted-foreground">
              {validatedCount} cơ hội đạt chuẩn xác thực
              {" · "}
              <span className="font-medium text-foreground tabular-nums">
                {topScore}
              </span>{" "}
              điểm cao nhất.{" "}
              <Link
                href="/dashboard/investment"
                className="text-primary hover:underline"
              >
                Xem hàng chờ đầu tư →
              </Link>
            </p>
          </div>

          {message && (
            <p className="flex items-center gap-2 text-sm text-signal-hot">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </p>
          )}
          {error && (
            <p className="flex items-center gap-2 text-sm text-signal-risk">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <Button asChild variant="outline" size="sm">
            <Link href="/opportunities">
              <Target className="mr-2 h-4 w-4" />
              Radar cơ hội
            </Link>
          </Button>
          <Button onClick={handleRun} disabled={running} size="sm">
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang chạy...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Chạy pipeline
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
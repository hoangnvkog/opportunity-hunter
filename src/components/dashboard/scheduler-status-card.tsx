"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { runPipelineAction, getLatestPipelineRunAction } from "@/actions/pipeline.actions";
import { Play, Activity, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface LatestRun {
  lastRun: string | null;
  lastStatus: string | null;
  lastDurationMs: number | null;
  rawPosts: number;
  painPoints: number;
  clusters: number;
  opportunities: number;
  ideas: number;
}

export function SchedulerStatusCard() {
  const [latestRun, setLatestRun] = useState<LatestRun | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<string | null>(null);
  const [triggerError, setTriggerError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getLatestPipelineRunAction();
        setLatestRun(data);
      } catch (error) {
        console.error("Failed to fetch status:", error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTrigger = async () => {
    setIsTriggering(true);
    setTriggerResult(null);
    setTriggerError(null);

    try {
      const result = await runPipelineAction();
      
      if (result.success && result.result) {
        setTriggerResult(`Pipeline đã chạy xong! Tạo được ${result.result.opportunities} cơ hội.`);
        setLatestRun({
          lastRun: result.result.finishedAt,
          lastStatus: result.result.success ? "success" : "failed",
          lastDurationMs: result.result.durationMs,
          rawPosts: result.result.rawPosts,
          painPoints: result.result.painPoints,
          clusters: result.result.clusters,
          opportunities: result.result.opportunities,
          ideas: result.result.ideas,
        });
      } else {
        setTriggerError(result.error || "Chạy pipeline thất bại");
      }
    } catch (error) {
      setTriggerError(error instanceof Error ? error.message : "Lỗi không xác định");
    } finally {
      setIsTriggering(false);
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "Chưa có";
    return new Date(dateStr).toLocaleString("vi-VN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusColor = latestRun?.lastStatus === "success"
    ? "bg-green-100 text-green-800"
    : latestRun?.lastStatus === "failed"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-800";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Trạng thái pipeline
            </CardTitle>
            <CardDescription>
              Theo dõi và chạy tự động luồng dữ liệu
            </CardDescription>
          </div>
          <Button
            onClick={handleTrigger}
            disabled={isTriggering}
            size="sm"
            variant="outline"
          >
            {isTriggering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang chạy...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Chạy ngay
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Lần chạy gần nhất
          </p>
          <div className="flex items-center gap-2">
            {latestRun?.lastStatus === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : latestRun?.lastStatus === "failed" ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : null}
            <Badge className={statusColor}>
              {latestRun?.lastStatus === "success"
                ? "THÀNH CÔNG"
                : latestRun?.lastStatus === "failed"
                  ? "THẤT BẠI"
                  : "ĐANG CHỜ"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatDateTime(latestRun?.lastRun ?? null)}
            </span>
          </div>
        </div>

        {/* Trigger Result */}
        {triggerResult && (
          <div className="p-3 rounded-md text-sm bg-green-50 text-green-900 border border-green-200">
            {triggerResult}
          </div>
        )}
        {triggerError && (
          <div className="p-3 rounded-md text-sm bg-red-50 text-red-900 border border-red-200">
            {triggerError}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

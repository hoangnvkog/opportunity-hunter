"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  getSchedulerStatusAction, 
  triggerPipelineAction,
  getHealthStatusAction 
} from "@/actions/pipeline.actions";
import { Play, Activity, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface SchedulerStatus {
  isRunning: boolean;
  lastRun: string | null;
  nextRun: string | null;
  isExecuting: boolean;
}

interface HealthStatus {
  database: "healthy" | "unhealthy";
  scheduler: "running" | "stopped";
  pipeline: "idle" | "executing" | "failed";
  lastCheck: string;
  details?: Record<string, unknown>;
}

export function SchedulerStatusCard() {
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [scheduler, health] = await Promise.all([
          getSchedulerStatusAction(),
          getHealthStatusAction(),
        ]);
        setSchedulerStatus(scheduler);
        setHealthStatus(health);
      } catch (error) {
        console.error("Failed to fetch status:", error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleTrigger = async () => {
    setIsTriggering(true);
    setTriggerResult(null);

    try {
      const result = await triggerPipelineAction();
      
      if (result.success) {
        setTriggerResult({
          success: true,
          message: `Pipeline completed successfully! Processed ${result.data?.opportunities || 0} opportunities.`,
        });
      } else {
        setTriggerResult({
          success: false,
          message: result.error || "Pipeline execution failed",
        });
      }
    } catch (error) {
      setTriggerResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsTriggering(false);
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>
              Scheduler and pipeline health monitoring
            </CardDescription>
          </div>
          <Button
            onClick={handleTrigger}
            disabled={isTriggering || schedulerStatus?.isExecuting}
            size="sm"
            variant="outline"
          >
            {isTriggering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Now
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scheduler Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Scheduler</p>
            <Badge variant={healthStatus?.scheduler === "running" ? "default" : "secondary"}>
              {healthStatus?.scheduler || "unknown"}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Pipeline</p>
            <Badge 
              variant={
                healthStatus?.pipeline === "idle" ? "secondary" :
                healthStatus?.pipeline === "executing" ? "default" :
                "destructive"
              }
            >
              {healthStatus?.pipeline || "unknown"}
            </Badge>
          </div>
        </div>

        {/* Last Run & Next Run */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last Run
            </p>
            <p className="text-sm font-semibold">
              {formatDateTime(schedulerStatus?.lastRun || null)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Next Run
            </p>
            <p className="text-sm font-semibold">
              {formatDateTime(schedulerStatus?.nextRun || null)}
            </p>
          </div>
        </div>

        {/* Health Checks */}
        <div className="space-y-2 pt-2 border-t">
          <p className="text-sm font-medium text-muted-foreground">Health Checks</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>Database</span>
              {healthStatus?.database === "healthy" ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
        </div>

        {/* Trigger Result */}
        {triggerResult && (
          <div 
            className={`p-3 rounded-md text-sm ${
              triggerResult.success 
                ? "bg-green-50 text-green-900 border border-green-200" 
                : "bg-red-50 text-red-900 border border-red-200"
            }`}
          >
            {triggerResult.message}
          </div>
        )}

        {/* Last Check */}
        <p className="text-xs text-muted-foreground text-center pt-2">
          Last updated: {formatDateTime(healthStatus?.lastCheck || null)}
        </p>
      </CardContent>
    </Card>
  );
}

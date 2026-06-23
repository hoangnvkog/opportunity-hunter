"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { SystemLogRow, LogLevel } from "@/types/admin";
import { AlertTriangle, Info, AlertCircle, Bug, Search } from "lucide-react";

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: "text-blue-500 bg-blue-50",
  warn: "text-yellow-600 bg-yellow-50",
  error: "text-red-600 bg-red-50",
  debug: "text-gray-500 bg-gray-50",
};

const LEVEL_ICONS: Record<LogLevel, React.ElementType> = {
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
  debug: Bug,
};

interface LogTableProps {
  logs: SystemLogRow[];
  total: number;
  onSearch?: (q: string) => void;
  onLevelFilter?: (level: LogLevel | null) => void;
}

export function LogTable({ logs, total, onSearch, onLevelFilter }: LogTableProps) {
  const [search, setSearch] = useState("");
  const [activeLevel, setActiveLevel] = useState<LogLevel | null>(null);

  function handleSearch(q: string) {
    setSearch(q);
    onSearch?.(q);
  }

  function handleLevel(level: LogLevel | null) {
    setActiveLevel(level);
    onLevelFilter?.(level);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>System Logs ({total.toLocaleString()})</CardTitle>
          <div className="flex gap-2">
            {(["info", "warn", "error", "debug"] as LogLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => handleLevel(activeLevel === level ? null : level)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium capitalize transition",
                  activeLevel === level ? LEVEL_COLORS[level] : "bg-secondary text-muted-foreground"
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No logs found
            </p>
          ) : (
            logs.map((log) => {
              const Icon = LEVEL_ICONS[log.level];
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className={cn("mt-0.5 rounded p-1", LEVEL_COLORS[log.level])}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono break-all">{log.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {JSON.stringify(log.metadata)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
import { SystemLogsRepository } from "@/lib/db/repositories/system-logs.repository";
import { MonitoringService } from "@/services/admin/monitoring.service";
import { LogTable } from "@/components/admin/LogTable";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Info, AlertCircle, Bug } from "lucide-react";
import type { LogLevel } from "@/types/admin";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage({
  searchParams
}: {
  searchParams: Promise<{ level?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const level = sp.level as LogLevel | undefined;
  const search = sp.q;
  const page = parseInt(sp.page ?? "1", 10);
  const limit = 50;
  const offset = (page - 1) * limit;

  const [logsRepo, monitoringService] = await Promise.all([
    SystemLogsRepository.create(),
    MonitoringService.create()
  ]);

  const [{ logs, total }, health] = await Promise.all([
    logsRepo.findAll({ level, search, limit, offset }),
    monitoringService.getSystemHealth()
  ]);

  const levelCounts = await logsRepo.countByLevel();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Logs</h1>
        <p className="text-muted-foreground mt-1">
          {total.toLocaleString()} total log entries
        </p>
      </div>

      {/* Level summary */}
      <div className="grid gap-4 grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-blue-50 p-2">
              <Info className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{levelCounts.info}</p>
              <p className="text-xs text-muted-foreground">Info</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-yellow-50 p-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{levelCounts.warn}</p>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-red-50 p-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{levelCounts.error}</p>
              <p className="text-xs text-muted-foreground">Errors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-gray-50 p-2">
              <Bug className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{levelCounts.debug}</p>
              <p className="text-xs text-muted-foreground">Debug</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs table — server component renders filter UI via URL params */}
      <LogTable
        logs={logs}
        total={total}
      />

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <a
              href={`/admin/logs?page=${page - 1}${level ? `&level=${level}` : ""}${search ? `&q=${search}` : ""}`}
              className="rounded-md border px-4 py-2 text-sm hover:bg-secondary"
            >
              Previous
            </a>
          )}
          <span className="px-4 py-2 text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          {offset + limit < total && (
            <a
              href={`/admin/logs?page=${page + 1}${level ? `&level=${level}` : ""}${search ? `&q=${search}` : ""}`}
              className="rounded-md border px-4 py-2 text-sm hover:bg-secondary"
            >
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
}
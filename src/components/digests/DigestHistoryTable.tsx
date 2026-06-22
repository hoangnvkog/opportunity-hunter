import type { DigestStatus } from "@/types/weekly-digest";

interface DigestRow {
  id: string;
  week_start: string;
  week_end: string;
  status: DigestStatus;
  sent_at: string | null;
  created_at: string;
}

interface DigestHistoryTableProps {
  digests: DigestRow[];
}

const STATUS_STYLES: Record<DigestStatus, string> = {
  queued: "bg-amber-100 text-amber-800",
  sent: "bg-emerald-100 text-emerald-800",
  failed: "bg-rose-100 text-rose-800",
};

function formatWeek(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const end = new Date(weekEnd).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${start} – ${end}`;
}

export function DigestHistoryTable({ digests }: DigestHistoryTableProps) {
  if (digests.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
        No digests yet. Your weekly summary lands here once the cron sends the first one.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Week</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Sent at</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {digests.map((digest) => (
            <tr key={digest.id} className="bg-card">
              <td className="px-4 py-3 font-medium">{formatWeek(digest.week_start, digest.week_end)}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[digest.status]}`}>
                  {digest.status}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {digest.sent_at
                  ? new Date(digest.sent_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(digest.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

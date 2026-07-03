/**
 * Sprint 64: Financial Admin
 *
 * Stats, model list, regenerate, export, compare.
 */

import Link from "next/link";
import {
  listModels,
  getDashboardStats,
} from "@/services/financial/financial.service";
import { RegenerateButton } from "./RegenerateButton";
import { DeleteButton } from "./DeleteButton";

export const dynamic = "force-dynamic";

export default async function FinancialAdminPage() {
  const [stats, models] = await Promise.all([
    getDashboardStats(),
    listModels({ limit: 100 }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">💰 Financial Admin</h1>
        <Link href="/dashboard/financial" className="text-sm text-blue-600 hover:underline">
          Dashboard →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Total Models</p>
          <p className="text-2xl font-bold">{stats.totalModels}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Projected ARR</p>
          <p className="text-2xl font-bold">
            {stats.projectedARR >= 1_000_000
              ? `$${(stats.projectedARR / 1_000_000).toFixed(1)}M`
              : `$${(stats.projectedARR / 1_000).toFixed(0)}K`}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Avg LTV/CAC</p>
          <p className="text-2xl font-bold">{stats.ltvCacRatio.toFixed(1)}x</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Avg Break-Even</p>
          <p className="text-2xl font-bold">Month {stats.breakEvenMonth}</p>
        </div>
      </div>

      {/* Models Table */}
      <div className="rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">All Financial Models</h2>
        </div>
        {models.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No financial models yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Model</th>
                  <th className="px-4 py-2 font-medium">Currency</th>
                  <th className="px-4 py-2 font-medium">Years</th>
                  <th className="px-4 py-2 font-medium">Created</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="px-4 py-2">
                      <Link href={`/dashboard/financial/${m.id}`} className="text-blue-600 hover:underline">
                        {m.venture_project_id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{m.currency}</td>
                    <td className="px-4 py-2">{m.projection_years}</td>
                    <td className="px-4 py-2">{new Date(m.created_at).toLocaleDateString()}</td>
                    <td className="flex gap-3 px-4 py-2">
                      <RegenerateButton ventureProjectId={m.venture_project_id} />
                      <DeleteButton modelId={m.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { SubscriptionsRepository } from "@/lib/db/repositories/subscriptions.repository";
import { ProfilesRepository } from "@/lib/db/repositories/profiles.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const [subscriptionsRepo, profilesRepo] = await Promise.all([
    SubscriptionsRepository.create(),
    ProfilesRepository.create(),
  ]);

  const [subscriptions, profiles] = await Promise.all([
    subscriptionsRepo.findAll(),
    profilesRepo.findAll(),
  ]);

  const rows = subscriptions.map((s) => {
    const profile = profiles.find((p) => p.id === s.user_id);
    return { ...s, email: profile?.email };
  });

  const statusCounts = subscriptions.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <p className="text-muted-foreground mt-1">
          {subscriptions.length} total subscriptions
        </p>
      </div>

      {/* Status summary */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card key={status}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground capitalize mt-1">{status}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">User</th>
                  <th className="text-left py-2 px-3 font-medium">Plan</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                  <th className="text-left py-2 px-3 font-medium">Period Start</th>
                  <th className="text-left py-2 px-3 font-medium">Period End</th>
                  <th className="text-left py-2 px-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-secondary/30">
                    <td className="py-2 px-3">{s.email ?? "—"}</td>
                    <td className="py-2 px-3 capitalize font-medium">{s.plan}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.status === "active"
                          ? "bg-green-100 text-green-700"
                          : s.status === "trialing"
                          ? "bg-blue-100 text-blue-700"
                          : s.status === "canceled"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {s.current_period_start
                        ? new Date(s.current_period_start).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {s.current_period_end
                        ? new Date(s.current_period_end).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
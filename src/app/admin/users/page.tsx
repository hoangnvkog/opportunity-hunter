import { ProfilesRepository } from "@/lib/db/repositories/profiles.repository";
import { SubscriptionsRepository } from "@/lib/db/repositories/subscriptions.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Users, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [profilesRepo, subscriptionsRepo] = await Promise.all([
    ProfilesRepository.create(),
    SubscriptionsRepository.create(),
  ]);

  const [profiles, subscriptions] = await Promise.all([
    profilesRepo.findAll(),
    subscriptionsRepo.findAll(),
  ]);

  const activeSubscriptions = subscriptions.filter(
    (s) => s.status === "active" || s.status === "trialing"
  );

  const userRows = profiles.map((p) => {
    const sub = subscriptions.find((s) => s.user_id === p.id);
    return {
      ...p,
      plan: sub?.plan ?? "free",
      subscriptionStatus: sub?.status ?? "none",
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground mt-1">
          {profiles.length} total users, {activeSubscriptions.length} active subscriptions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users ({profiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Email</th>
                  <th className="text-left py-2 px-3 font-medium">Name</th>
                  <th className="text-left py-2 px-3 font-medium">Role</th>
                  <th className="text-left py-2 px-3 font-medium">Plan</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                  <th className="text-left py-2 px-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {userRows.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-secondary/30">
                    <td className="py-2 px-3">{user.email}</td>
                    <td className="py-2 px-3">{user.name ?? "—"}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-secondary text-muted-foreground"
                      }`}>
                        {user.role === "admin" && <Shield className="h-3 w-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="py-2 px-3 capitalize">{user.plan}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.subscriptionStatus === "active"
                          ? "bg-green-100 text-green-700"
                          : user.subscriptionStatus === "trialing"
                          ? "bg-blue-100 text-blue-700"
                          : user.subscriptionStatus === "canceled"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {user.subscriptionStatus}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
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
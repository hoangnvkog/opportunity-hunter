export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getUserAlertsAction, markAllAlertsReadAction } from "@/actions/alerts.actions";
import { AlertCard } from "@/components/alerts/AlertCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function AlertsPage() {
  const client = await getSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const alerts = await getUserAlertsAction();
  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread alert${unreadCount === 1 ? "" : "s"}.`
              : "All caught up! No unread alerts."}
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllAlertsReadAction}>
            <Button type="submit" variant="outline">
              Mark All as Read
            </Button>
          </form>
        )}
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No alerts yet. Create a watchlist to start receiving alerts for matching opportunities.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onMarkRead={() => {
                // Page will automatically refresh due to revalidatePath
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

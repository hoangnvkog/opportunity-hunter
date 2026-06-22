import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { getUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { listUserDigestsAction } from "@/actions/weekly-digest.actions";
import { DigestHistoryTable } from "@/components/digests/DigestHistoryTable";
import { QueueDigestButton } from "@/components/digests/QueueDigestButton";

export default async function DigestsPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const digests = await listUserDigestsAction();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Weekly Digests</h1>
            <p className="text-muted-foreground mt-1">
              Past summaries delivered to your inbox. Generate a fresh digest any time.
            </p>
          </div>
          <QueueDigestButton />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
            <CardDescription>
              {digests.length} {digests.length === 1 ? "digest" : "digests"} delivered.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DigestHistoryTable digests={digests} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

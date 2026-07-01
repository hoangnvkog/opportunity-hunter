import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { listUserDigestsAction } from "@/actions/weekly-digest.actions";
import { DigestHistoryTable } from "@/components/digests/DigestHistoryTable";
import { QueueDigestButton } from "@/components/digests/QueueDigestButton";

export default async function DigestsPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const digests = await listUserDigestsAction();
  const latest = digests[0];
  const latestStats = latest?.stats;
  const hasAiSummary = !!(latestStats?.ai_summary || latestStats?.top_recommendation);

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

        {latest && hasAiSummary && (
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>
                Latest digest — {latest.week_start} → {latest.week_end}
              </CardTitle>
              <CardDescription>
                AI-generated summary from the newest digest on file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestStats?.ai_summary && (
                <div className="rounded-md border border-violet-200 bg-violet-50 p-4 text-sm leading-relaxed text-violet-950">
                  {latestStats.ai_summary}
                </div>
              )}
              {latestStats?.top_recommendation && (
                <div className="rounded-md border bg-background p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Top AI recommendation
                  </div>
                  <Link
                    href={`/opportunities/${latestStats.top_recommendation.opportunity_id}`}
                    className="mt-1 block text-base font-semibold text-foreground hover:underline"
                  >
                    {latestStats.top_recommendation.title}
                  </Link>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {latestStats.top_recommendation.summary}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Confidence{" "}
                    {Math.round(latestStats.top_recommendation.confidence_score * 100)}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getUserWatchlistsAction } from "@/actions/watchlists.actions";
import { WatchlistCard } from "@/components/watchlists/WatchlistCard";
import { WatchlistForm } from "@/components/watchlists/WatchlistForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function WatchlistsPage() {
  const client = await getSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const watchlists = await getUserWatchlistsAction();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Watchlists</h1>
        <p className="text-muted-foreground">
          Create watchlists to monitor opportunities that match your criteria.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Create New Watchlist</CardTitle>
            </CardHeader>
            <CardContent>
              <WatchlistForm
                onSuccess={() => {
                  // Page will automatically refresh due to revalidatePath
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Watchlists ({watchlists.length})</h2>
          {watchlists.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No watchlists yet. Create your first watchlist to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {watchlists.map((watchlist) => (
                <WatchlistCard
                  key={watchlist.id}
                  watchlist={watchlist}
                  onDelete={() => {
                    // Page will automatically refresh due to revalidatePath
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

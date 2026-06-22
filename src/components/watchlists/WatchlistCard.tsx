import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { deleteWatchlistAction } from "@/actions/watchlists.actions";
import type { WatchlistCardData } from "@/types/watchlist";

interface WatchlistCardProps {
  watchlist: WatchlistCardData;
  onDelete?: () => void;
}

export function WatchlistCard({ watchlist, onDelete }: WatchlistCardProps) {
  async function handleDelete() {
    try {
      await deleteWatchlistAction(watchlist.id);
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("Failed to delete watchlist:", error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {watchlist.name}
          {watchlist.alert_count > 0 && (
            <Badge variant="default">{watchlist.alert_count} alerts</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Created {new Date(watchlist.created_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {watchlist.search && (
          <div>
            <span className="text-muted-foreground">Search:</span> {watchlist.search}
          </div>
        )}
        {watchlist.min_score !== null && (
          <div>
            <span className="text-muted-foreground">Min Score:</span> {watchlist.min_score}
          </div>
        )}
        {watchlist.min_frequency !== null && (
          <div>
            <span className="text-muted-foreground">Min Frequency:</span> {watchlist.min_frequency}
          </div>
        )}
        {watchlist.min_severity !== null && (
          <div>
            <span className="text-muted-foreground">Min Severity:</span> {watchlist.min_severity}
          </div>
        )}
        {watchlist.min_buying_intent !== null && (
          <div>
            <span className="text-muted-foreground">Min Buying Intent:</span> {watchlist.min_buying_intent}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
        >
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}

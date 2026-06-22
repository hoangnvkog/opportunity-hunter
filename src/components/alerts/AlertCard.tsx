import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { markAlertReadAction } from "@/actions/alerts.actions";
import type { AlertCardData } from "@/types/watchlist";

interface AlertCardProps {
  alert: AlertCardData;
  onMarkRead?: () => void;
}

export function AlertCard({ alert, onMarkRead }: AlertCardProps) {
  async function handleMarkRead() {
    try {
      await markAlertReadAction(alert.id);
      if (onMarkRead) {
        onMarkRead();
      }
    } catch (error) {
      console.error("Failed to mark alert as read:", error);
    }
  }

  return (
    <Card className={!alert.is_read ? "border-l-4 border-l-blue-500" : ""}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {alert.opportunity_title}
          {!alert.is_read && <Badge variant="default">New</Badge>}
        </CardTitle>
        <CardDescription>
          From watchlist: {alert.watchlist_name} • {new Date(alert.created_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Cluster:</span> {alert.cluster_name}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Score:</span> {alert.score.toFixed(2)}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = `/opportunities/${alert.opportunity_id}`}
          >
            View Opportunity
          </Button>
          {!alert.is_read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkRead}
            >
              Mark as Read
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Visual heatmap of the top categories by opportunity count. Cell intensity
 * reflects how dominant that category is across the dataset.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Flame, Layers } from "lucide-react";

interface SignalHeatmapProps {
  trends: Array<{ category: string; count: number }>;
}

export function SignalHeatmap({ trends }: SignalHeatmapProps) {
  if (!trends || trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Market Signal Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Layers className="h-5 w-5" />}
            title="Chưa có dữ liệu tín hiệu"
            description="Chạy pipeline để AI phân tích cụm pain point và sinh danh mục."
          />
        </CardContent>
      </Card>
    );
  }

  const max = Math.max(...trends.map((t) => t.count), 1);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Market Signal Heatmap
        </CardTitle>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Top {trends.length}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        {trends.map(({ category, count }) => {
          const intensity = count / max; // 0-1
          const tone = intensityToTone(intensity);
          return (
            <div key={category} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{category}</span>
                <span className="tabular-nums text-muted-foreground">
                  {count} cơ hội
                </span>
              </div>
              <div className="grid h-3 grid-cols-10 gap-0.5">
                {Array.from({ length: 10 }).map((_, i) => {
                  const threshold = (i + 1) / 10;
                  const filled = intensity >= threshold;
                  return (
                    <span
                      key={i}
                      className={`h-3 rounded-sm ${filled ? tone : "bg-secondary"}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function intensityToTone(intensity: number): string {
  if (intensity >= 0.8) return "bg-signal-hot";
  if (intensity >= 0.5) return "bg-signal-good";
  if (intensity >= 0.3) return "bg-signal-watch";
  return "bg-signal-cold";
}

export { Flame };
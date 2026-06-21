import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import type { OpportunityView } from "@/services/opportunities";

interface OpportunityTableProps {
  opportunities: OpportunityView[];
}

export default function OpportunityTable({ opportunities }: OpportunityTableProps) {
  if (opportunities.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No opportunities found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">All Opportunities</h2>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Score
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Frequency
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Severity
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Buying Intent
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Sources
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Recency
                </th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opportunity) => (
                <tr key={opportunity.id} className="border-b hover:bg-secondary/50">
                  <td className="py-3 px-4">
                    <Link
                      href={`/opportunities/${opportunity.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {opportunity.title}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-sm">{opportunity.score}</td>
                  <td className="py-3 px-4 text-sm">{opportunity.frequency}</td>
                  <td className="py-3 px-4 text-sm">{opportunity.severity.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm">{opportunity.buyingIntent.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm">
                    {opportunity.sourceDiversity != null
                      ? opportunity.sourceDiversity.toFixed(2)
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {opportunity.recencyScore != null
                      ? opportunity.recencyScore.toFixed(2)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
export { OpportunityTable };

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getValidatedOpportunities } from "@/actions/validation.actions";

interface ValidatedOpportunitiesTableProps {
  userId: string | null;
}

export async function ValidatedOpportunitiesTable({
  userId: _userId,
}: ValidatedOpportunitiesTableProps) {
  const result = await getValidatedOpportunities();
  const opportunities = result.success ? (result.data ?? []) : [];

  return (
    <>
      {/* Validation Score Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Validation Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end justify-between space-x-1">
            {[20, 35, 50, 42, 65, 55, 78, 88, 72, 90].map((height, i) => (
              <div key={i} className="flex flex-col items-center w-full">
                <div
                  className="w-full bg-primary/30 rounded-t"
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs mt-1 text-muted-foreground">
                  {(i * 10).toString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Validated Opportunities Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Validated Opportunities ({opportunities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {opportunities.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Opportunity</th>
                    <th className="text-right py-2 font-medium">Score</th>
                    <th className="text-right py-2 font-medium">Market Demand</th>
                    <th className="text-right py-2 font-medium">Pain Severity</th>
                    <th className="text-right py-2 font-medium">Buying Intent</th>
                    <th className="text-right py-2 font-medium">Competition Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((opp) => (
                    <tr key={opp.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="font-medium">{opp.cluster_name}</div>
                        <div className="text-muted-foreground text-xs max-w-xs truncate">
                          {opp.cluster_description}
                        </div>
                      </td>
                      <td className="text-right py-3">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          {opp.validation_score}
                        </span>
                      </td>
                      <td className="text-right py-3">{opp.market_demand}</td>
                      <td className="text-right py-3">{opp.pain_severity}</td>
                      <td className="text-right py-3">{opp.buying_intent}</td>
                      <td className="text-right py-3">{opp.competition_risk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No validated opportunities yet. Run the pipeline to generate validations.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
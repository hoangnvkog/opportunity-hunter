import { OpportunityEvidenceRepository } from "@/lib/db/repositories/opportunity-evidence.repository";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminEvidencePage() {
  const [evidenceRepo, opportunitiesRepo] = await Promise.all([
    OpportunityEvidenceRepository.create(),
    OpportunitiesRepository.create(),
  ]);

  const evidence = await evidenceRepo.list({ limit: 100 });
  const total = await evidenceRepo.count();
  const avgConfidence = await evidenceRepo.averageConfidence();
  const opportunitiesWithEvidence = await evidenceRepo.countOpportunitiesWithEvidence();

  // Get opportunity IDs and fetch their names
  const opportunityIds = [...new Set(evidence.map((e) => e.opportunity_id))];
  const opportunities = await opportunitiesRepo.findByIds(opportunityIds);
  const opportunityMap = new Map(opportunities.map((o) => [o.id, o]));

  // Group by opportunity
  const byOpportunity = evidence.reduce<Record<string, { count: number; avgConfidence: number; oppName: string }>>(
    (acc, e) => {
      if (!acc[e.opportunity_id]) {
        const opp = opportunityMap.get(e.opportunity_id);
        acc[e.opportunity_id] = { count: 0, avgConfidence: 0, oppName: opp?.title || e.opportunity_id };
      }
      acc[e.opportunity_id].count++;
      acc[e.opportunity_id].avgConfidence += e.confidence;
      return acc;
    },
    {},
  );

  // Calculate averages
  for (const [, data] of Object.entries(byOpportunity)) {
    data.avgConfidence = Math.round((data.avgConfidence / data.count) * 100) / 100;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Market Evidence</h1>
        <p className="text-muted-foreground mt-1">
          {total} total evidence records
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Evidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConfidence.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Opportunities with Evidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{opportunitiesWithEvidence}</div>
          </CardContent>
        </Card>
      </div>

      {/* Evidence by Opportunity */}
      <Card>
        <CardHeader>
          <CardTitle>Evidence by Opportunity</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(byOpportunity).length === 0 ? (
            <p className="text-muted-foreground text-sm">No evidence generated yet. Run the pipeline.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(byOpportunity).map(([oppId, data]) => (
                <div
                  key={oppId}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{data.oppName}</p>
                    <p className="text-xs text-muted-foreground">{oppId.slice(0, 8)}...</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{data.count} items</p>
                      <p className="text-xs text-muted-foreground">avg {data.avgConfidence}%</p>
                    </div>
                    <Badge variant="outline">
                      {data.avgConfidence >= 80 ? "High" : data.avgConfidence >= 60 ? "Medium" : "Low"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
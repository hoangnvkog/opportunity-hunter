/**
 * Sprint 63: Venture Project Detail Page
 *
 * Shows the full venture project: canvas, GTM, MVP, pricing, launch checklist.
 */

import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { getProjectDetailAction } from "@/actions/venture-studio.actions";
import {
  generateLaunchChecklist,
  generatePricingRecommendation,
  generateGtmRecommendation,
} from "@/services/venture-studio/venture-studio.service";
import type { VentureProjectDetail } from "@/types/venture-studio";

export const dynamic = "force-dynamic";

function getScoreColor(score: number) {
  if (score >= 90) return "text-green-700";
  if (score >= 70) return "text-blue-600";
  if (score >= 50) return "text-yellow-600";
  return "text-gray-600";
}

function Section({ title, content }: { title: string; content: string }) {
  if (!content) return null;
  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </h4>
      <div className="text-sm whitespace-pre-wrap">{content}</div>
    </div>
  );
}

export default async function VentureProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getProjectDetailAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const detail = result.data as VentureProjectDetail;
  const { project, canvas, gtm, mvp } = detail;

  // Compute recommendations based on project data
  const detailObj: VentureProjectDetail = { project, canvas, gtm, mvp };
  const checklist = generateLaunchChecklist(detailObj);
  const pricing = generatePricingRecommendation(detailObj);
  const gtmRecs = generateGtmRecommendation(detailObj);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground mt-1">{project.tagline}</p>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={project.status === "ready" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
              {project.status}
            </Badge>
            <span className={`text-sm font-bold ${getScoreColor(project.overall_score)}`}>
              Score: {project.overall_score}
            </span>
            <span className="text-sm text-muted-foreground">
              Created: {new Date(project.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Business Model Canvas */}
        {canvas && (
          <Card>
            <CardHeader>
              <CardTitle>📊 Business Model Canvas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <Section title="Problem" content={canvas.problem} />
              <Section title="Solution" content={canvas.solution} />
              <Section title="Value Proposition" content={canvas.value_proposition} />
              <Section title="Customer Segments" content={canvas.customer_segments} />
              <Section title="Channels" content={canvas.channels} />
              <Section title="Customer Relationships" content={canvas.customer_relationships} />
              <Section title="Key Activities" content={canvas.key_activities} />
              <Section title="Key Resources" content={canvas.key_resources} />
              <Section title="Key Partners" content={canvas.key_partners} />
              <Section title="Cost Structure" content={canvas.cost_structure} />
              <Section title="Revenue Streams" content={canvas.revenue_streams} />
            </CardContent>
          </Card>
        )}

        {/* MVP */}
        {mvp && (
          <Card>
            <CardHeader>
              <CardTitle>🚀 MVP Plan</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <Section title="Core Features" content={mvp.core_features} />
              <Section title="Tech Stack" content={mvp.tech_stack} />
              <Section title="Estimated Cost" content={mvp.estimated_cost} />
              <Section title="Estimated Time" content={mvp.estimated_time} />
              <div className="md:col-span-2">
                <Section title="Roadmap" content={mvp.roadmap} />
              </div>
              <div className="md:col-span-2">
                <Section title="Risks" content={mvp.risks} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Roadmap (from MVP) */}
        {mvp?.roadmap && (
          <Card>
            <CardHeader>
              <CardTitle>📅 Roadmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm whitespace-pre-wrap">{mvp.roadmap}</div>
            </CardContent>
          </Card>
        )}

        {/* Go-to-Market */}
        {gtm && (
          <Card>
            <CardHeader>
              <CardTitle>🎯 Go-to-Market Strategy</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <Section title="Launch Strategy" content={gtm.launch_strategy} />
              <Section title="Acquisition Channels" content={gtm.acquisition_channels} />
              <Section title="Pricing Strategy" content={gtm.pricing_strategy} />
              <Section title="Growth Loops" content={gtm.growth_loops} />
              <Section title="Marketing Plan" content={gtm.marketing_plan} />
              <Section title="Sales Plan" content={gtm.sales_plan} />
            </CardContent>
          </Card>
        )}

        {/* Pricing Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>💰 Pricing Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pricing.map((p) => (
                <div key={p.model} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.model}</span>
                    {p.recommended && (
                      <Badge className="bg-green-100 text-green-800">Recommended</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                  <p className="text-xs mt-1 italic">{p.reasoning}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* GTM Channel Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>📣 Channel Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gtmRecs.map((c) => (
                <div key={c.channel} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.channel}</span>
                    {c.recommended && (
                      <Badge className="bg-green-100 text-green-800">Recommended</Badge>
                    )}
                  </div>
                  <p className="text-xs mt-1 italic">{c.reasoning}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Launch Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>✅ Launch Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checklist.map((section) => (
                <div key={section.category}>
                  <h4 className="font-semibold text-sm mb-2">{section.category}</h4>
                  <ul className="space-y-1">
                    {section.items.map((item, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-muted-foreground">☐</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

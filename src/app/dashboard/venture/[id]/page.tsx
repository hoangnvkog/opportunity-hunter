/**
 * Sprint 63: Venture Project Detail Page
 * UI-4 polish — tabs (Tổng quan / Canvas / GTM / MVP / Pricing / Checklist),
 * design system tokens, signal-aware badges.
 */

import { notFound } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, statusVariant } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { VentureBlueprintTabs } from "@/components/venture/venture-blueprint-tabs";
import { getProjectDetailAction } from "@/actions/venture-studio.actions";
import {
  generateLaunchChecklist,
  generatePricingRecommendation,
  generateGtmRecommendation,
} from "@/services/venture-studio/venture-studio.service";
import type { VentureProjectDetail } from "@/types/venture-studio";
import { Rocket, Star, Calendar, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

function statusLabel(status: string): string {
  switch (status) {
    case "ready":
      return "Sẵn sàng";
    case "archived":
      return "Đã lưu trữ";
    default:
      return status;
  }
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

  const detailObj: VentureProjectDetail = { project, canvas, gtm, mvp };
  const checklist = generateLaunchChecklist(detailObj);
  const pricing = generatePricingRecommendation(detailObj);
  const gtmRecs = generateGtmRecommendation(detailObj);

  const scoreTone =
    project.overall_score >= 85
      ? "hot"
      : project.overall_score >= 70
        ? "ai"
        : project.overall_score >= 50
          ? "info"
          : "default";

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title={project.name}
          description={project.tagline}
          badge={
            <Badge variant={statusVariant(project.status)}>
              {statusLabel(project.status)}
            </Badge>
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Overall Score"
            value={project.overall_score}
            tone={scoreTone}
            icon={<Star className="h-4 w-4" />}
          />
          <MetricCard
            title="Status"
            value={statusLabel(project.status)}
            tone={project.status === "ready" ? "hot" : "default"}
            icon={<Rocket className="h-4 w-4" />}
          />
          <MetricCard
            title="Created"
            value={new Date(project.created_at).toLocaleDateString("vi-VN")}
            icon={<Calendar className="h-4 w-4" />}
          />
          <MetricCard
            title="Checklist items"
            value={checklist.reduce((sum, s) => sum + s.items.length, 0)}
            tone="info"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
        </div>

        <VentureBlueprintTabs
          canvas={canvas}
          gtm={gtm}
          mvp={mvp}
          pricing={pricing}
          gtmRecs={gtmRecs}
          checklist={checklist}
        />
      </div>
    </AppLayout>
  );
}

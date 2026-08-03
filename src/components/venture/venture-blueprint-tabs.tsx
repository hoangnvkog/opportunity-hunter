/**
 * Venture Blueprint Tabs — splits a venture project into 5 tabs:
 *   • Canvas — Business Model Canvas (problem → solution → customers...)
 *   • GTM    — Go-to-market strategy + channel recommendations
 *   • MVP    — Core features, roadmap, tech, risks
 *   • Pricing — Pricing models with recommendation flags
 *   • Checklist — Launch checklist grouped by category
 *
 * Pure presentation — receives every section as props, no I/O.
 */
import type {
  VentureCanvasRow,
  VentureGtmRow,
  VentureMvpRow,
} from "@/types/venture-studio";
import type {
  LaunchChecklistItem,
  PricingRecommendation,
  GtmChannelRecommendation,
} from "@/services/venture-studio/venture-studio.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import {
  LayoutGrid,
  Target,
  Rocket,
  DollarSign,
  ListChecks,
  Star,
} from "lucide-react";

export interface VentureBlueprintTabsProps {
  canvas: VentureCanvasRow | null;
  gtm: VentureGtmRow | null;
  mvp: VentureMvpRow | null;
  pricing: PricingRecommendation[];
  gtmRecs: GtmChannelRecommendation[];
  checklist: LaunchChecklistItem[];
}

export function VentureBlueprintTabs({
  canvas,
  gtm,
  mvp,
  pricing,
  gtmRecs,
  checklist,
}: VentureBlueprintTabsProps) {
  return (
    <Tabs defaultValue="canvas" className="space-y-4">
      <TabsList className="flex flex-wrap">
        <TabsTrigger value="canvas" className="gap-1.5">
          <LayoutGrid className="h-3.5 w-3.5" />
          Canvas
        </TabsTrigger>
        <TabsTrigger value="gtm" className="gap-1.5">
          <Target className="h-3.5 w-3.5" />
          Go-to-Market
        </TabsTrigger>
        <TabsTrigger value="mvp" className="gap-1.5">
          <Rocket className="h-3.5 w-3.5" />
          MVP
        </TabsTrigger>
        <TabsTrigger value="pricing" className="gap-1.5">
          <DollarSign className="h-3.5 w-3.5" />
          Pricing
        </TabsTrigger>
        <TabsTrigger value="checklist" className="gap-1.5">
          <ListChecks className="h-3.5 w-3.5" />
          Checklist
        </TabsTrigger>
      </TabsList>

      <TabsContent value="canvas">
        <CanvasPanel canvas={canvas} />
      </TabsContent>
      <TabsContent value="gtm">
        <GtmPanel gtm={gtm} gtmRecs={gtmRecs} />
      </TabsContent>
      <TabsContent value="mvp">
        <MvpPanel mvp={mvp} />
      </TabsContent>
      <TabsContent value="pricing">
        <PricingPanel pricing={pricing} />
      </TabsContent>
      <TabsContent value="checklist">
        <ChecklistPanel checklist={checklist} />
      </TabsContent>
    </Tabs>
  );
}

// ---------------------------------------------------------------------------
// Canvas
// ---------------------------------------------------------------------------

function CanvasPanel({ canvas }: { canvas: VentureCanvasRow | null }) {
  if (!canvas) {
    return (
      <EmptyState
        icon={<LayoutGrid className="h-5 w-5" />}
        title="Chưa có Business Model Canvas"
        description="Canvas được tạo cùng venture project."
      />
    );
  }

  const cells: Array<{
    title: string;
    content: string;
    tone: "headline" | "left" | "center" | "right";
  }> = [
    { title: "Problem", content: canvas.problem, tone: "headline" },
    { title: "Solution", content: canvas.solution, tone: "headline" },
    { title: "Value Proposition", content: canvas.value_proposition, tone: "headline" },
    { title: "Customer Segments", content: canvas.customer_segments, tone: "left" },
    { title: "Channels", content: canvas.channels, tone: "left" },
    { title: "Customer Relationships", content: canvas.customer_relationships, tone: "left" },
    { title: "Key Activities", content: canvas.key_activities, tone: "center" },
    { title: "Key Resources", content: canvas.key_resources, tone: "center" },
    { title: "Key Partners", content: canvas.key_partners, tone: "center" },
    { title: "Cost Structure", content: canvas.cost_structure, tone: "right" },
    { title: "Revenue Streams", content: canvas.revenue_streams, tone: "right" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" />
          Business Model Canvas
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {cells.map((c) => (
          <CanvasCell key={c.title} title={c.title} content={c.content} tone={c.tone} />
        ))}
      </CardContent>
    </Card>
  );
}

function CanvasCell({
  title,
  content,
  tone,
}: {
  title: string;
  content: string;
  tone: "headline" | "left" | "center" | "right";
}) {
  if (!content) return null;
  const toneClass = {
    headline:
      "border-primary/30 bg-primary/5 ring-1 ring-primary/10",
    left: "border-signal-info/30 bg-signal-info-soft/40",
    center: "border-signal-ai/30 bg-signal-ai-soft/40",
    right: "border-signal-good/30 bg-signal-good-soft/40",
  }[tone];

  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GTM
// ---------------------------------------------------------------------------

function GtmPanel({
  gtm,
  gtmRecs,
}: {
  gtm: VentureGtmRow | null;
  gtmRecs: GtmChannelRecommendation[];
}) {
  if (!gtm && gtmRecs.length === 0) {
    return (
      <EmptyState
        icon={<Target className="h-5 w-5" />}
        title="Chưa có GTM strategy"
      />
    );
  }

  return (
    <div className="space-y-4">
      {gtm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Chiến lược ra mắt
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field title="Launch Strategy" content={gtm.launch_strategy} />
            <Field title="Acquisition Channels" content={gtm.acquisition_channels} />
            <Field title="Pricing Strategy" content={gtm.pricing_strategy} />
            <Field title="Growth Loops" content={gtm.growth_loops} />
            <div className="md:col-span-2">
              <Field title="Marketing Plan" content={gtm.marketing_plan} />
            </div>
            <div className="md:col-span-2">
              <Field title="Sales Plan" content={gtm.sales_plan} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Kênh được đề xuất
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {gtmRecs.map((c) => (
            <ChannelRow key={c.channel} channel={c.channel} recommended={c.recommended} reasoning={c.reasoning} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ChannelRow({
  channel,
  recommended,
  reasoning,
}: {
  channel: string;
  recommended: boolean;
  reasoning: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{channel}</span>
          {recommended && <Badge variant="hot">Recommended</Badge>}
        </div>
        {reasoning && (
          <p className="mt-1 text-xs italic text-muted-foreground">{reasoning}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MVP
// ---------------------------------------------------------------------------

function MvpPanel({ mvp }: { mvp: VentureMvpRow | null }) {
  if (!mvp) {
    return (
      <EmptyState
        icon={<Rocket className="h-5 w-5" />}
        title="Chưa có MVP plan"
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-4 w-4" />
          MVP Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Field title="Core Features" content={mvp.core_features} />
          <Field title="Tech Stack" content={mvp.tech_stack} />
          <Field title="Estimated Cost" content={mvp.estimated_cost} />
          <Field title="Estimated Time" content={mvp.estimated_time} />
        </div>
        <div>
          <Field title="Roadmap" content={mvp.roadmap} />
        </div>
        <div>
          <Field title="Risks" content={mvp.risks} />
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

function PricingPanel({ pricing }: { pricing: PricingRecommendation[] }) {
  if (pricing.length === 0) {
    return (
      <EmptyState
        icon={<DollarSign className="h-5 w-5" />}
        title="Chưa có pricing recommendation"
      />
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Pricing Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {pricing.map((p) => (
          <div key={p.model} className="rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">{p.model}</span>
              {p.recommended && <Badge variant="hot">Recommended</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
            {p.reasoning && (
              <p className="mt-1 text-xs italic text-muted-foreground">{p.reasoning}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Checklist
// ---------------------------------------------------------------------------

function ChecklistPanel({ checklist }: { checklist: LaunchChecklistItem[] }) {
  if (checklist.length === 0) {
    return (
      <EmptyState
        icon={<ListChecks className="h-5 w-5" />}
        title="Chưa có launch checklist"
      />
    );
  }

  const total = checklist.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-4 w-4" />
          Launch Checklist
          <Badge variant="secondary">{total} items</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {checklist.map((section) => (
          <div key={section.category}>
            <h4 className="mb-2 text-sm font-semibold">{section.category}</h4>
            <ul className="space-y-1.5">
              {section.items.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm"
                >
                  <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] text-muted-foreground">
                    ☐
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Field({ title, content }: { title: string; content: string }) {
  if (!content) return null;
  return (
    <div className="space-y-1">
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}

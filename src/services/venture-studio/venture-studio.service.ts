/**
 * Sprint 63: AI Venture Studio Service
 *
 * Responsibilities:
 * - Generate complete startup blueprints from validated opportunities
 * - Generate Business Model Canvas, Lean Canvas, GTM, MVP, Pricing, Roadmap, Launch Checklist
 * - Persist to venture_projects, venture_canvas, venture_gtm, venture_mvp tables
 * - Gate: startup_score overall_score >= 75 (lower threshold than venture reports since this is "buildable")
 * - Track analytics events
 */

import type {
  VentureProjectRow,
  VentureProjectDetail,
  VentureStudioStats,
  VentureStudioGenerationResult,
} from "@/types/venture-studio";
import { createAIProvider, getAIProviderFromEnv } from "@/lib/ai";
import { VentureProjectsRepository } from "@/lib/db/repositories/venture-projects.repository";
import { VentureCanvasRepository } from "@/lib/db/repositories/venture-canvas.repository";
import { VentureGtmRepository } from "@/lib/db/repositories/venture-gtm.repository";
import { VentureMvpRepository } from "@/lib/db/repositories/venture-mvp.repository";
import { StartupScoresRepository } from "@/lib/db/repositories/startup-scores.repository";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import { StartupIdeasRepository } from "@/lib/db/repositories/startup-ideas.repository";

/**
 * Threshold for generating venture projects (Sprint 63 spec).
 * Generates for opportunities with startup_score overall_score >= 75.
 * Lower than venture reports (80) since this is about "ready to build".
 */
export const VENTURE_PROJECT_SCORE_THRESHOLD = 75;

export type AIProviderType = "mock" | "openai" | "gemini";

function buildProvider(providerType?: AIProviderType) {
  return providerType
    ? createAIProvider({ type: providerType })
    : getAIProviderFromEnv();
}

/**
 * Generate a complete venture project for a single opportunity (if eligible).
 *
 * Gates:
 * - startup_score overall_score >= 75
 */
export async function generateVentureProject(
  opportunityId: string,
  providerType?: AIProviderType,
): Promise<VentureStudioGenerationResult> {
  const projectsRepo = await VentureProjectsRepository.create();
  const canvasRepo = await VentureCanvasRepository.create();
  const gtmRepo = await VentureGtmRepository.create();
  const mvpRepo = await VentureMvpRepository.create();
  const scoresRepo = await StartupScoresRepository.create();
  const opportunityRepo = await OpportunitiesRepository.create();

  const opportunity = await opportunityRepo.findById(opportunityId);
  if (!opportunity) {
    return { processed: 0, generated: 0, skipped: 0, inserted: 0 };
  }

  const score = await scoresRepo.findByOpportunity(opportunityId);
  if (!score) {
    return { processed: 1, generated: 0, skipped: 1, inserted: 0 };
  }

  if (Number(score.overall_score) < VENTURE_PROJECT_SCORE_THRESHOLD) {
    return { processed: 1, generated: 0, skipped: 1, inserted: 0 };
  }

  // Idempotent: check if project already exists
  const existing = await projectsRepo.findByOpportunity(opportunityId);
  if (existing) {
    return { processed: 1, generated: 0, skipped: 1, inserted: 0 };
  }

  // Build the opportunity input for AI
  const provider = buildProvider(providerType);
  const [ventureProject] = await provider.generateVentureProject([
    {
      id: opportunityId,
      score: score.overall_score,
      frequency: opportunity.frequency,
      severity: Number(opportunity.severity ?? 0),
      buying_intent: Number(opportunity.buying_intent ?? 0),
      cluster_name: opportunity.title,
      cluster_description: opportunity.description ?? "(no description)",
    },
  ]);

  if (!ventureProject) {
    return { processed: 1, generated: 0, skipped: 0, inserted: 0 };
  }

  // Get the startup idea id if available
  const ideasRepo = await StartupIdeasRepository.create();
  const [idea] = await ideasRepo.list({ opportunityId, limit: 1 });

  // Create the venture project record
  const project = await projectsRepo.create({
    opportunity_id: opportunityId,
    startup_idea_id: idea?.id ?? null,
    name: ventureProject.name,
    tagline: ventureProject.tagline,
    status: "ready",
    overall_score: ventureProject.overall_score,
  });

  // Create canvas record
  await canvasRepo.create({
    venture_project_id: project.id,
    problem: ventureProject.canvas.problem,
    solution: ventureProject.canvas.solution,
    value_proposition: ventureProject.canvas.value_proposition,
    customer_segments: ventureProject.canvas.customer_segments,
    channels: ventureProject.canvas.channels,
    customer_relationships: ventureProject.canvas.customer_relationships,
    key_activities: ventureProject.canvas.key_activities,
    key_resources: ventureProject.canvas.key_resources,
    key_partners: ventureProject.canvas.key_partners,
    cost_structure: ventureProject.canvas.cost_structure,
    revenue_streams: ventureProject.canvas.revenue_streams,
  });

  // Create GTM record
  await gtmRepo.create({
    venture_project_id: project.id,
    launch_strategy: ventureProject.gtm.launch_strategy,
    acquisition_channels: ventureProject.gtm.acquisition_channels,
    pricing_strategy: ventureProject.gtm.pricing_strategy,
    growth_loops: ventureProject.gtm.growth_loops,
    marketing_plan: ventureProject.gtm.marketing_plan,
    sales_plan: ventureProject.gtm.sales_plan,
  });

  // Create MVP record
  await mvpRepo.create({
    venture_project_id: project.id,
    core_features: ventureProject.mvp.core_features,
    roadmap: ventureProject.mvp.roadmap,
    tech_stack: ventureProject.mvp.tech_stack,
    estimated_cost: ventureProject.mvp.estimated_cost,
    estimated_time: ventureProject.mvp.estimated_time,
    risks: ventureProject.mvp.risks,
  });

  // Analytics: track generation
  emitAnalytics({
    event: "venture_generated",
    opportunity_id: opportunityId,
    project_id: project.id,
    overall_score: ventureProject.overall_score,
  });

  return { processed: 1, generated: 1, skipped: 0, inserted: 1 };
}

/**
 * Generate venture projects for multiple opportunities (batch mode).
 */
export async function generateBatch(
  limit?: number,
  providerType?: AIProviderType,
): Promise<VentureStudioGenerationResult> {
  const scoresRepo = await StartupScoresRepository.create();

  // Find eligible opportunities (score >= threshold)
  const allScores = await scoresRepo.list({ limit: limit ?? 50 });
  const eligibleScores = allScores.filter(
    (s) => Number(s.overall_score) >= VENTURE_PROJECT_SCORE_THRESHOLD,
  );

  const result: VentureStudioGenerationResult = {
    processed: 0,
    generated: 0,
    skipped: 0,
    inserted: 0,
  };

  for (const score of eligibleScores.slice(0, limit ?? 10)) {
    const partial = await generateVentureProject(score.opportunity_id, providerType);
    result.processed += partial.processed;
    result.generated += partial.generated;
    result.skipped += partial.skipped;
    result.inserted += partial.inserted;
  }

  return result;
}

/**
 * Get top venture projects for the dashboard.
 */
export async function getTopProjects(limit: number = 50): Promise<VentureProjectRow[]> {
  const repo = await VentureProjectsRepository.create();
  return repo.list({ limit, orderBy: "overall_score", ascending: false });
}

/**
 * Get statistics for the dashboard.
 */
export async function getStatistics(): Promise<VentureStudioStats> {
  const projectsRepo = await VentureProjectsRepository.create();
  const mvpRepo = await VentureMvpRepository.create();

  const stats = await projectsRepo.getStats();

  // Enrich with MVP cost data
  const mvpCount = await mvpRepo.count();
  if (mvpCount > 0) {
    // Use a default estimate since MVP cost is a text field
    stats.averageMvpCost = mvpCount > 0 ? "$15,000-$25,000" : "$0";
  }

  return stats;
}

/**
 * Get a complete venture project detail (project + canvas + gtm + mvp).
 */
export async function getProjectDetail(
  projectId: string,
): Promise<VentureProjectDetail | null> {
  const projectsRepo = await VentureProjectsRepository.create();
  const canvasRepo = await VentureCanvasRepository.create();
  const gtmRepo = await VentureGtmRepository.create();
  const mvpRepo = await VentureMvpRepository.create();

  const project = await projectsRepo.findById(projectId);
  if (!project) return null;

  const [canvas, gtm, mvp] = await Promise.all([
    canvasRepo.findByProject(projectId),
    gtmRepo.findByProject(projectId),
    mvpRepo.findByProject(projectId),
  ]);

  return { project, canvas, gtm, mvp };
}

/**
 * Regenerate a venture project (delete existing + create new).
 */
export async function regenerateProject(
  projectId: string,
  providerType?: AIProviderType,
): Promise<VentureStudioGenerationResult> {
  const projectsRepo = await VentureProjectsRepository.create();
  const canvasRepo = await VentureCanvasRepository.create();
  const gtmRepo = await VentureGtmRepository.create();
  const mvpRepo = await VentureMvpRepository.create();

  const project = await projectsRepo.findById(projectId);
  if (!project) {
    return { processed: 0, generated: 0, skipped: 0, inserted: 0 };
  }

  const opportunityId = project.opportunity_id;

  // Delete existing records
  await canvasRepo.deleteByProject(projectId);
  await gtmRepo.deleteByProject(projectId);
  await mvpRepo.deleteByProject(projectId);
  await projectsRepo.delete(projectId);

  // Generate new
  return generateVentureProject(opportunityId, providerType);
}

/**
 * Delete a venture project and its related records.
 */
export async function deleteProject(projectId: string): Promise<void> {
  const projectsRepo = await VentureProjectsRepository.create();
  const canvasRepo = await VentureCanvasRepository.create();
  const gtmRepo = await VentureGtmRepository.create();
  const mvpRepo = await VentureMvpRepository.create();

  await canvasRepo.deleteByProject(projectId);
  await gtmRepo.deleteByProject(projectId);
  await mvpRepo.deleteByProject(projectId);
  await projectsRepo.delete(projectId);
}

/**
 * Archive a venture project (set status to "archived").
 */
export async function archiveProject(projectId: string): Promise<VentureProjectRow> {
  const projectsRepo = await VentureProjectsRepository.create();
  return projectsRepo.update(projectId, { status: "archived" });
}

/**
 * Generate a launch checklist for a venture project.
 * Returns structured checklist data based on the project's canvas/GTM/MVP.
 */
export function generateLaunchChecklist(
  detail: VentureProjectDetail,
): LaunchChecklistItem[] {
  return [
    {
      category: "Domain",
      items: [
        "Register domain name",
        "Set up DNS",
        "Configure SSL certificate",
      ],
    },
    {
      category: "Landing Page",
      items: [
        "Build landing page with value proposition",
        "Add email capture form",
        "Add social proof / testimonials",
      ],
    },
    {
      category: "Authentication",
      items: [
        "Implement user auth (Supabase Auth or similar)",
        "Add Google/GitHub OAuth",
        "Set up role-based access control",
      ],
    },
    {
      category: "Payments",
      items: [
        "Integrate Stripe or similar payment provider",
        "Set up subscription billing",
        "Create pricing page based on: " + (detail.mvp?.estimated_cost ?? "custom"),
      ],
    },
    {
      category: "Analytics",
      items: [
        "Set up Posthog / Mixpanel / GA4",
        "Add conversion funnel tracking",
        "Set up error monitoring (Sentry)",
      ],
    },
    {
      category: "Customer Support",
      items: [
        "Set up help desk (Intercom / Crisp)",
        "Create FAQ / help center",
        "Set up email support workflow",
      ],
    },
    {
      category: "Legal",
      items: [
        "Create Terms of Service",
        "Create Privacy Policy",
        "Set up cookie consent",
        "Register business entity",
      ],
    },
    {
      category: "Email",
      items: [
        "Set up transactional email (Resend / SendGrid)",
        "Create onboarding email sequence",
        "Set up newsletter",
      ],
    },
    {
      category: "Monitoring",
      items: [
        "Set up uptime monitoring",
        "Configure alerting (PagerDuty / Slack)",
        "Set up log aggregation",
      ],
    },
    {
      category: "Deployment",
      items: [
        "Set up CI/CD pipeline",
        "Configure staging environment",
        "Set up production deployment (Vercel / Railway)",
        "Configure database backups",
      ],
    },
  ];
}

/**
 * Generate a pricing recommendation with reasoning.
 */
export function generatePricingRecommendation(
  _detail: VentureProjectDetail,
): PricingRecommendation[] {
  return [
    {
      model: "Subscription",
      description: "Monthly/annual recurring revenue with tiered plans",
      recommended: true,
      reasoning: "Best for SaaS with ongoing value delivery. Predictable MRR.",
    },
    {
      model: "Freemium",
      description: "Free tier with limited features, paid tiers for full access",
      recommended: true,
      reasoning: "Drives adoption and PLG. Converts based on usage limits.",
    },
    {
      model: "Usage-based",
      description: "Pay per API call / action / credit",
      recommended: false,
      reasoning: "Good for API-first products. Harder to predict revenue.",
    },
    {
      model: "Marketplace",
      description: "Commission on transactions between buyers and sellers",
      recommended: false,
      reasoning: "Requires critical mass. Not suitable for early-stage SaaS.",
    },
    {
      model: "Enterprise",
      description: "Custom pricing for large organizations",
      recommended: false,
      reasoning: "High ACV but long sales cycles. Add once you have traction.",
    },
    {
      model: "Transaction",
      description: "Fee per transaction processed",
      recommended: false,
      reasoning: "Works for payment/checkout products. Not universal.",
    },
  ];
}

/**
 * Generate a GTM channel recommendation with reasoning.
 */
export function generateGtmRecommendation(
  _detail: VentureProjectDetail,
): GtmChannelRecommendation[] {
  return [
    {
      channel: "SEO",
      recommended: true,
      reasoning: "Long-term organic traffic. Build authority with content.",
    },
    {
      channel: "Reddit",
      recommended: true,
      reasoning: "Community validation and early adopter acquisition.",
    },
    {
      channel: "Product Hunt",
      recommended: true,
      reasoning: "Launch buzz. Gets in front of tech-forward early adopters.",
    },
    {
      channel: "LinkedIn",
      recommended: true,
      reasoning: "B2B lead generation. Thought leadership content.",
    },
    {
      channel: "Cold Email",
      recommended: false,
      reasoning: "Works for enterprise. Lower ROI for SMB self-serve.",
    },
    {
      channel: "Partnership",
      recommended: false,
      reasoning: "Scale through integrations. Requires existing traction.",
    },
    {
      channel: "Community",
      recommended: true,
      reasoning: "Build loyalty. User-generated content and referrals.",
    },
    {
      channel: "TikTok",
      recommended: false,
      reasoning: "Good for consumer/B2C. Less relevant for B2B SaaS.",
    },
  ];
}

/**
 * Fire-and-forget analytics event (same pattern as other services).
 */
function emitAnalytics(payload: Record<string, unknown>): void {
  console.info("[analytics] venture_studio", JSON.stringify(payload));
}

// ---------------------------------------------------------------------------
// Types for checklist / pricing / GTM
// ---------------------------------------------------------------------------

export interface LaunchChecklistItem {
  category: string;
  items: string[];
}

export interface PricingRecommendation {
  model: string;
  description: string;
  recommended: boolean;
  reasoning: string;
}

export interface GtmChannelRecommendation {
  channel: string;
  recommended: boolean;
  reasoning: string;
}

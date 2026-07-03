import { describe, it, expect } from "vitest";
import {
  toJson,
  toMarkdown,
  toPdfHtml,
  renderVenture,
  ventureFilename,
  mimeFor,
} from "../venture-studio-export";
import type { VentureProjectDetail } from "@/types/venture-studio";

const mockDetail: VentureProjectDetail = {
  project: {
    id: "proj-1",
    opportunity_id: "opp-1",
    startup_idea_id: null,
    name: "Test Venture Project",
    tagline: "A test tagline",
    status: "ready",
    overall_score: 85,
    created_at: "2026-07-03T00:00:00Z",
    updated_at: "2026-07-03T00:00:00Z",
  },
  canvas: {
    id: "canvas-1",
    venture_project_id: "proj-1",
    problem: "Test problem",
    solution: "Test solution",
    value_proposition: "Test VP",
    customer_segments: "Test segments",
    channels: "SEO, Reddit",
    customer_relationships: "Self-serve",
    key_activities: "Build product",
    key_resources: "Engineering team",
    key_partners: "AWS",
    cost_structure: "Engineering 40%",
    revenue_streams: "SaaS $99/mo",
    created_at: "2026-07-03T00:00:00Z",
  },
  gtm: {
    id: "gtm-1",
    venture_project_id: "proj-1",
    launch_strategy: "Beta → Product Hunt",
    acquisition_channels: "SEO, Reddit, LinkedIn",
    pricing_strategy: "Freemium → Pro",
    growth_loops: "Templates → SEO → Signup",
    marketing_plan: "2 posts/week",
    sales_plan: "PLG for SMB",
    created_at: "2026-07-03T00:00:00Z",
  },
  mvp: {
    id: "mvp-1",
    venture_project_id: "proj-1",
    core_features: "1. Core engine\n2. Templates\n3. Analytics",
    roadmap: "Week 1: Auth. Week 2: Engine. Month 2: Analytics.",
    tech_stack: "Next.js, Supabase, OpenAI",
    estimated_cost: "$15,000-$25,000",
    estimated_time: "3 months to MVP",
    risks: "AI accuracy, cold start",
    created_at: "2026-07-03T00:00:00Z",
  },
};

describe("venture-studio-export", () => {
  describe("toJson", () => {
    it("returns valid JSON", () => {
      const result = toJson(mockDetail);
      const parsed = JSON.parse(result);
      expect(parsed.project.name).toBe("Test Venture Project");
      expect(parsed.canvas.problem).toBe("Test problem");
      expect(parsed.gtm.launch_strategy).toBe("Beta → Product Hunt");
      expect(parsed.mvp.core_features).toContain("Core engine");
    });
  });

  describe("toMarkdown", () => {
    it("returns markdown with project name", () => {
      const result = toMarkdown(mockDetail);
      expect(result).toContain("# Test Venture Project");
      expect(result).toContain("A test tagline");
      expect(result).toContain("## Business Model Canvas");
      expect(result).toContain("## MVP Plan");
      expect(result).toContain("## Go-to-Market Strategy");
    });

    it("includes canvas sections", () => {
      const result = toMarkdown(mockDetail);
      expect(result).toContain("### Problem");
      expect(result).toContain("Test problem");
      expect(result).toContain("### Solution");
      expect(result).toContain("Test solution");
    });

    it("includes MVP sections", () => {
      const result = toMarkdown(mockDetail);
      expect(result).toContain("### Core Features");
      expect(result).toContain("### Tech Stack");
      expect(result).toContain("### Estimated Cost");
    });
  });

  describe("toPdfHtml", () => {
    it("returns valid HTML", () => {
      const result = toPdfHtml(mockDetail);
      expect(result).toContain("<!doctype html>");
      expect(result).toContain("Test Venture Project");
      expect(result).toContain("Business Model Canvas");
      expect(result).toContain("MVP Plan");
    });
  });

  describe("renderVenture", () => {
    it("renders as json", () => {
      const result = renderVenture(mockDetail, "json");
      expect(JSON.parse(result).project.name).toBe("Test Venture Project");
    });

    it("renders as markdown", () => {
      const result = renderVenture(mockDetail, "markdown");
      expect(result).toContain("# Test Venture Project");
    });

    it("renders as pdf", () => {
      const result = renderVenture(mockDetail, "pdf");
      expect(result).toContain("<!doctype html>");
    });
  });

  describe("ventureFilename", () => {
    it("returns a slugified filename", () => {
      const result = ventureFilename(mockDetail, "markdown");
      expect(result).toBe("test-venture-project.md");
    });

    it("returns json extension", () => {
      const result = ventureFilename(mockDetail, "json");
      expect(result).toBe("test-venture-project.json");
    });

    it("returns pdf extension", () => {
      const result = ventureFilename(mockDetail, "pdf");
      expect(result).toBe("test-venture-project.pdf");
    });
  });

  describe("mimeFor", () => {
    it("returns correct MIME types", () => {
      expect(mimeFor("json")).toBe("application/json; charset=utf-8");
      expect(mimeFor("markdown")).toBe("text/markdown; charset=utf-8");
      expect(mimeFor("pdf")).toBe("application/pdf");
    });
  });
});

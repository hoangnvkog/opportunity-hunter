/**
 * Sprint 58: Investment Memo Export Utilities Tests
 */

import { describe, it, expect } from "vitest";
import {
  renderMemo,
  toJson,
  toMarkdown,
  toPdfHtml,
  toDocxHtml,
  memoFilename,
  mimeFor,
  type ExportFormat,
} from "../investment-memo-export";
import type { InvestmentMemoRow } from "@/types/investment-memo";

const makeRow = (
  overrides: Partial<InvestmentMemoRow> = {},
): InvestmentMemoRow =>
  ({
    id: "memo-1",
    opportunity_id: "opp-1",
    venture_report_id: "vr-1",
    investment_score_id: "sc-1",
    title: "Investment Memo — Workflow AI",
    thesis: "Workflow AI is the next big thing.",
    market: "$2.4B globally",
    problem: "Teams waste 8h/week on manual workarounds.",
    solution: "AI-first workflow automation for SMBs.",
    business_model: "PLG SaaS, $99-499/mo",
    traction: "200 active users in private beta.",
    competition: "Zapier, Make, Airtable.",
    risks: "Distribution risk and LLM cost scaling.",
    strengths: "Founder shipped 2 prior exits in vertical.",
    why_now: "GPT-4 crossed quality/cost threshold.",
    investment_decision: "INVEST — lead the round at $2M-$4M seed.",
    recommendation: "STRONG BUY",
    confidence: 92,
    memo_version: 1,
    created_at: "2026-06-30T04:00:00Z",
    ...overrides,
  } as InvestmentMemoRow);

describe("Investment Memo Export Utilities", () => {
  describe("toJson()", () => {
    it("renders memo as pretty-printed JSON", () => {
      const json = toJson(makeRow());
      const parsed = JSON.parse(json) as InvestmentMemoRow;
      expect(parsed.title).toBe("Investment Memo — Workflow AI");
      expect(parsed.recommendation).toBe("STRONG BUY");
      expect(parsed.confidence).toBe(92);
    });

    it("includes all 14 expected fields", () => {
      const parsed = JSON.parse(toJson(makeRow())) as Record<string, unknown>;
      const expectedFields = [
        "title",
        "thesis",
        "market",
        "problem",
        "solution",
        "business_model",
        "traction",
        "competition",
        "risks",
        "strengths",
        "why_now",
        "investment_decision",
        "recommendation",
        "confidence",
      ];
      for (const f of expectedFields) {
        expect(parsed[f]).toBeDefined();
      }
    });
  });

  describe("toMarkdown()", () => {
    it("renders memo as a Markdown document", () => {
      const md = toMarkdown(makeRow());
      expect(md).toMatch(/^# /);
      expect(md).toContain("## Investment Thesis");
      expect(md).toContain("## Market");
      expect(md).toContain("## Problem");
      expect(md).toContain("## Solution");
      expect(md).toContain("## Business Model");
      expect(md).toContain("## Traction");
      expect(md).toContain("## Competition");
      expect(md).toContain("## Strengths");
      expect(md).toContain("## Risks");
      expect(md).toContain("## Why Now");
      expect(md).toContain("STRONG BUY");
      expect(md).toContain("92%");
      expect(md).toContain("INVEST — lead the round");
    });

    it("includes the recommendation + confidence + version header", () => {
      const md = toMarkdown(makeRow({ memo_version: 3 }));
      expect(md).toContain("STRONG BUY");
      expect(md).toContain("92%");
      expect(md).toContain("v3");
    });

    it("skips empty sections", () => {
      const md = toMarkdown(makeRow({ risks: "" }));
      expect(md).not.toContain("## Risks");
    });
  });

  describe("toPdfHtml()", () => {
    it("produces a self-contained HTML document", () => {
      const html = toPdfHtml(makeRow());
      expect(html).toMatch(/^<!doctype html>/i);
      expect(html).toContain("<html");
      expect(html).toContain("<head>");
      expect(html).toContain("<body>");
      expect(html).toContain("<style>");
    });

    it("includes title, recommendation, confidence", () => {
      const html = toPdfHtml(makeRow());
      expect(html).toContain("Investment Memo — Workflow AI");
      expect(html).toContain("STRONG BUY");
      expect(html).toContain("92%");
      expect(html).toContain("INVEST — lead the round");
    });

    it("includes all 10 sections (Investment Thesis + 9 standard)", () => {
      const html = toPdfHtml(makeRow());
      expect(html).toContain("Investment Thesis");
      expect(html).toContain("Market");
      expect(html).toContain("Problem");
      expect(html).toContain("Solution");
      expect(html).toContain("Business Model");
      expect(html).toContain("Traction");
      expect(html).toContain("Competition");
      expect(html).toContain("Strengths");
      expect(html).toContain("Risks");
      expect(html).toContain("Why Now");
    });

    it("escapes HTML in user-controlled strings", () => {
      const html = toPdfHtml(makeRow({ title: "<script>alert(1)</script>" }));
      // Raw script tag must NOT survive in the output
      expect(html).not.toContain("<script>alert(1)</script>");
      // Escaped form should be present
      expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    });
  });

  describe("toDocxHtml()", () => {
    it("produces a Word-readable HTML document", () => {
      const html = toDocxHtml(makeRow());
      expect(html).toMatch(/^<html/i);
      expect(html).toContain("Investment Memo — Workflow AI");
      expect(html).toContain("STRONG BUY");
    });

    it("uses Word XML namespaces", () => {
      const html = toDocxHtml(makeRow());
      expect(html).toContain("xmlns:o");
      expect(html).toContain("xmlns:w");
    });

    it("escapes HTML in user-controlled strings", () => {
      const html = toDocxHtml(makeRow({ title: "<script>alert(1)</script>" }));
      expect(html).not.toContain("<script>alert(1)</script>");
      expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    });
  });

  describe("renderMemo()", () => {
    const formats: ExportFormat[] = ["pdf", "markdown", "json", "docx"];

    it.each(formats)("renders for format=%s", (format) => {
      const out = renderMemo(makeRow(), format);
      expect(out.length).toBeGreaterThan(0);
    });

    it("formats differ", () => {
      const row = makeRow();
      expect(renderMemo(row, "json")).not.toBe(renderMemo(row, "markdown"));
      expect(renderMemo(row, "pdf")).toMatch(/<!doctype html>/i);
    });
  });

  describe("memoFilename()", () => {
    it("slugs the title + version", () => {
      const f = memoFilename(makeRow({ title: "Investment Memo — Workflow AI" }), "pdf");
      expect(f).toMatch(/^investment-memo-workflow-ai-v1\.pdf$/);
    });

    it("uses the format-specific extension", () => {
      expect(memoFilename(makeRow(), "json").endsWith(".json")).toBe(true);
      expect(memoFilename(makeRow(), "markdown").endsWith(".md")).toBe(true);
      expect(memoFilename(makeRow(), "docx").endsWith(".doc")).toBe(true);
    });

    it("falls back to id prefix when title has no alphanumerics", () => {
      const f = memoFilename(makeRow({ title: "----" }), "json");
      // slug yields empty string -> falls back to id prefix
      expect(f).toMatch(/^memo-.+-v1\.json$/);
      expect(f).toContain("memo-1");
    });
  });

  describe("mimeFor()", () => {
    it("returns the right MIME for each format", () => {
      expect(mimeFor("pdf")).toContain("pdf");
      expect(mimeFor("markdown")).toContain("markdown");
      expect(mimeFor("json")).toContain("json");
      expect(mimeFor("docx")).toContain("msword");
    });
  });
});
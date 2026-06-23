import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock logAiUsageFromResponse before importing provider
vi.mock("@/lib/ai/ai-usage", () => ({
  logAiUsageFromResponse: vi.fn(),
}));

// Use vi.hoisted to make mockCreate accessible in vi.mock
const { mockCreate } = vi.hoisted(() => {
  const mockCreate = vi.fn();
  return { mockCreate };
});

// Mock OpenAI - constructor returns object with chat.completions.create
vi.mock("openai", () => {
  class MockOpenAI {
    chat = { completions: { create: mockCreate } };
    embeddings = { create: vi.fn() };
  }
  return { default: MockOpenAI };
});

import { OpenAIProvider } from "@/lib/ai/openai.provider";

describe("OpenAIProvider", () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new OpenAIProvider("test-key");
  });

  it("should throw if no apiKey", () => {
    expect(() => new OpenAIProvider(undefined)).toThrow("OPENAI_API_KEY is required");
  });

  describe("extractPainPoints", () => {
    it("should parse valid JSON response with results array", async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ results: [
          { pain: "Slow website", category: "technical", severity: 0.8, buying_intent: 0.7 },
        ] }) } }],
        usage: { prompt_tokens: 100, completion_tokens: 50 },
      });

      const result = await provider.extractPainPoints([
        { source: "reddit", title: "T1", content: "C1", url: "u1", score: 100, created_at: "2026-06-23" },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ pain: "Slow website", category: "technical" });
    });

    it("should return empty array for invalid JSON", async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: "not json {{{" } }],
        usage: { prompt_tokens: 100, completion_tokens: 50 },
      });

      const result = await provider.extractPainPoints([
        { source: "reddit", title: "T1", content: "C1", url: "u1", score: 100, created_at: "2026-06-23" },
      ]);

      expect(result).toEqual([]);
    });

    it("should filter out invalid entries", async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ results: [
          { pain: "Valid", category: "tech", severity: 0.5, buying_intent: 0.5 },
          { incomplete: true },
        ] }) } }],
        usage: { prompt_tokens: 100, completion_tokens: 50 },
      });

      const result = await provider.extractPainPoints([
        { source: "reddit", title: "T1", content: "C1", url: "u1", score: 100, created_at: "2026-06-23" },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].pain).toBe("Valid");
    });

    it("should return empty on API error", async () => {
      mockCreate.mockRejectedValue(new Error("Rate limit"));

      const result = await provider.extractPainPoints([
        { source: "reddit", title: "T1", content: "C1", url: "u1", score: 100, created_at: "2026-06-23" },
      ]);

      expect(result).toEqual([]);
    });
  });

  describe("clusterPainPoints", () => {
    it("should parse valid cluster response", async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ results: [
          { cluster_name: "Performance", description: "Speed problems" },
        ] }) } }],
        usage: { prompt_tokens: 100, completion_tokens: 50 },
      });

      const result = await provider.clusterPainPoints([
        { pain: "Slow site", category: "tech", severity: 0.8, buying_intent: 0.7 },
      ]);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].cluster_name).toBe("Performance");
    });

    it("should return empty on error", async () => {
      mockCreate.mockRejectedValue(new Error("Timeout"));

      const result = await provider.clusterPainPoints([
        { pain: "Slow site", category: "tech", severity: 0.8, buying_intent: 0.7 },
      ]);

      expect(result).toEqual([]);
    });
  });

  describe("generateOpportunities", () => {
    it("should parse valid opportunity response", async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ results: [
          { score: 85, frequency: 10, severity: 0.8, buying_intent: 0.7 },
        ] }) } }],
        usage: { prompt_tokens: 100, completion_tokens: 50 },
      });

      const result = await provider.generateOpportunities([
        { cluster_name: "Perf", description: "Speed", pain_point_indexes: [0] },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(85);
    });

    it("should return empty on error", async () => {
      mockCreate.mockRejectedValue(new Error("API down"));

      const result = await provider.generateOpportunities([
        { cluster_name: "Perf", description: "Speed", pain_point_indexes: [0] },
      ]);

      expect(result).toEqual([]);
    });
  });

  describe("generateStartupIdeas", () => {
    it("should parse valid startup idea response", async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ results: [
          { problem: "Slow sites", solution: "Speed tool", mvp: "Chrome ext", pricing: "$9/mo", customer: "Devs", distribution: "SEO", competitors: "Lighthouse" },
        ] }) } }],
        usage: { prompt_tokens: 100, completion_tokens: 50 },
      });

      const result = await provider.generateStartupIdeas([
        { score: 85, frequency: 10, severity: 0.8, buying_intent: 0.7 },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].problem).toBe("Slow sites");
    });

    it("should return empty on error", async () => {
      mockCreate.mockRejectedValue(new Error("API error"));

      const result = await provider.generateStartupIdeas([
        { score: 85, frequency: 10, severity: 0.8, buying_intent: 0.7 },
      ]);

      expect(result).toEqual([]);
    });
  });
});

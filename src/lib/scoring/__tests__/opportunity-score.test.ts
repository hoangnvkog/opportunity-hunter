import { describe, it, expect } from "vitest";
import {
  calculateRecencyScore,
  calculateSourceDiversityScore,
  calculateClusterSizeScore,
  calculateOpportunityScore,
} from "@/lib/scoring/opportunity-score";

describe("Opportunity Scoring Engine", () => {
  describe("calculateRecencyScore", () => {
    it("returns 1.0 for posts from today", () => {
      const score = calculateRecencyScore(0);
      expect(score).toBe(1.0);
    });

    it("returns high score for recent posts (1-7 days)", () => {
      expect(calculateRecencyScore(1)).toBeGreaterThan(0.9);
      expect(calculateRecencyScore(7)).toBeGreaterThan(0.7);
    });

    it("returns low score for old posts (30+ days)", () => {
      const score = calculateRecencyScore(60);
      expect(score).toBeLessThanOrEqual(0.2);
    });

    it("clamps to minimum 0.2", () => {
      const score = calculateRecencyScore(100);
      expect(score).toBe(0.2);
    });
  });

  describe("calculateSourceDiversityScore", () => {
    it("returns low score for single source", () => {
      const score = calculateSourceDiversityScore(1);
      expect(score).toBeLessThan(0.5);
    });

    it("returns high score for 5+ sources", () => {
      const score = calculateSourceDiversityScore(5);
      expect(score).toBeGreaterThanOrEqual(0.9);
    });

    it("scales with source count", () => {
      const score1 = calculateSourceDiversityScore(1);
      const score3 = calculateSourceDiversityScore(3);
      const score5 = calculateSourceDiversityScore(5);

      expect(score3).toBeGreaterThan(score1);
      expect(score5).toBeGreaterThan(score3);
    });

    it("clamps to [0, 1]", () => {
      expect(calculateSourceDiversityScore(0)).toBeGreaterThanOrEqual(0);
      expect(calculateSourceDiversityScore(100)).toBeLessThanOrEqual(1);
    });
  });

  describe("calculateClusterSizeScore", () => {
    it("returns low score for single pain point", () => {
      const score = calculateClusterSizeScore(1);
      expect(score).toBeLessThan(0.5);
    });

    it("returns high score for 10+ pain points", () => {
      const score = calculateClusterSizeScore(10);
      expect(score).toBeGreaterThanOrEqual(0.9);
    });

    it("clamps to [0, 1]", () => {
      expect(calculateClusterSizeScore(0)).toBeGreaterThanOrEqual(0);
      expect(calculateClusterSizeScore(100)).toBeLessThanOrEqual(1);
    });
  });

  describe("calculateOpportunityScore", () => {
    it("all values high → score > 90", () => {
      const score = calculateOpportunityScore({
        frequency: 1.0,
        severity: 1.0,
        buying_intent: 1.0,
        cluster_size: 1.0,
        recency_score: 1.0,
        source_diversity: 1.0,
      });
      expect(score).toBeGreaterThan(90);
      expect(score).toBe(100);
    });

    it("all values low → score < 30", () => {
      const score = calculateOpportunityScore({
        frequency: 0.1,
        severity: 0.1,
        buying_intent: 0.1,
        cluster_size: 0.1,
        recency_score: 0.1,
        source_diversity: 0.1,
      });
      expect(score).toBeLessThan(30);
    });

    it("all values zero → score is 0", () => {
      const score = calculateOpportunityScore({
        frequency: 0,
        severity: 0,
        buying_intent: 0,
        cluster_size: 0,
        recency_score: 0,
        source_diversity: 0,
      });
      expect(score).toBe(0);
    });

    it("mixed values → valid score in [0, 100]", () => {
      const score = calculateOpportunityScore({
        frequency: 0.8,
        severity: 0.5,
        buying_intent: 0.3,
        cluster_size: 0.6,
        recency_score: 0.9,
        source_diversity: 0.4,
      });
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("optional fields default to 0.5 when undefined", () => {
      const score = calculateOpportunityScore({
        frequency: 1.0,
        severity: 1.0,
        buying_intent: 1.0,
        // cluster_size, recency_score, source_diversity are undefined
      });
      // 0.25*1 + 0.25*1 + 0.25*1 + 0.10*0.5 + 0.10*0.5 + 0.05*0.5 = 0.75 + 0.05 + 0.05 + 0.025 = 0.875
      expect(score).toBe(88); // Math.round(0.875 * 100)
    });

    it("clamps values outside [0, 1] range", () => {
      const scoreHigh = calculateOpportunityScore({
        frequency: 5.0,
        severity: 2.0,
        buying_intent: 3.0,
        cluster_size: 10.0,
        recency_score: 4.0,
        source_diversity: 6.0,
      });
      expect(scoreHigh).toBe(100);

      const scoreLow = calculateOpportunityScore({
        frequency: -1.0,
        severity: -2.0,
        buying_intent: -0.5,
        cluster_size: -1.0,
        recency_score: -1.0,
        source_diversity: -1.0,
      });
      expect(scoreLow).toBe(0);
    });

    it("weights are applied correctly", () => {
      // Only frequency = 1, rest = 0 → expect 25
      const onlyFreq = calculateOpportunityScore({
        frequency: 1.0,
        severity: 0,
        buying_intent: 0,
        cluster_size: 0,
        recency_score: 0,
        source_diversity: 0,
      });
      expect(onlyFreq).toBe(25);

      // Only severity = 1, rest = 0 → expect 25
      const onlySev = calculateOpportunityScore({
        frequency: 0,
        severity: 1.0,
        buying_intent: 0,
        cluster_size: 0,
        recency_score: 0,
        source_diversity: 0,
      });
      expect(onlySev).toBe(25);

      // Only cluster_size = 1, rest = 0 → expect 10
      const onlyCluster = calculateOpportunityScore({
        frequency: 0,
        severity: 0,
        buying_intent: 0,
        cluster_size: 1.0,
        recency_score: 0,
        source_diversity: 0,
      });
      expect(onlyCluster).toBe(10);

      // Only source_diversity = 1, rest = 0 → expect 5
      const onlySource = calculateOpportunityScore({
        frequency: 0,
        severity: 0,
        buying_intent: 0,
        cluster_size: 0,
        recency_score: 0,
        source_diversity: 1.0,
      });
      expect(onlySource).toBe(5);
    });
  });
});

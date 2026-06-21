import { describe, it, expect } from "vitest";
import { clusterPainPointsBySimilarity } from "../semantic-cluster";
import type { PainPointEmbedding } from "@/types/clustering";

/**
 * Helper to create unit vectors in different directions
 */
function createUnitVector(dimension: number, activeIndex: number): number[] {
  const vec = new Array(dimension).fill(0);
  vec[activeIndex] = 1;
  return vec;
}

/**
 * Helper to create vectors with specific similarity
 */
function createSimilarVectors(
  base: number[],
  similarity: number
): number[] {
  // Create a vector that has cosine similarity = similarity with base
  // For simplicity, we'll interpolate between base and a perpendicular vector
  const perp = base.map((_, i) => (i === 0 ? 0 : 1 / Math.sqrt(base.length - 1)));
  perp[0] = 0;

  const result = base.map((v, i) => {
    return v * similarity + perp[i] * Math.sqrt(1 - similarity * similarity);
  });

  return result;
}

describe("Semantic Cluster Engine", () => {
  describe("clusterPainPointsBySimilarity", () => {
    it("groups similar pain points into same cluster (connected graph)", () => {
      // A-B-C chain: A similar to B, B similar to C
      const base = createUnitVector(10, 0);
      const vecA = base;
      const vecB = createSimilarVectors(base, 0.95); // A-B similar
      const vecC = createSimilarVectors(vecB, 0.95); // B-C similar

      const embeddings: PainPointEmbedding[] = [
        { painPointId: "a", description: "A", embedding: vecA },
        { painPointId: "b", description: "B", embedding: vecB },
        { painPointId: "c", description: "C", embedding: vecC },
      ];

      const clusters = clusterPainPointsBySimilarity(embeddings, {
        similarityThreshold: 0.85,
      });

      expect(clusters.length).toBe(1);
      expect(clusters[0].members.length).toBe(3);
    });

    it("separates dissimilar pain points into different clusters", () => {
      // Two orthogonal vectors
      const vecA = createUnitVector(10, 0);
      const vecB = createUnitVector(10, 1); // Orthogonal to A

      const embeddings: PainPointEmbedding[] = [
        { painPointId: "a", description: "A", embedding: vecA },
        { painPointId: "b", description: "B", embedding: vecB },
      ];

      const clusters = clusterPainPointsBySimilarity(embeddings, {
        similarityThreshold: 0.85,
      });

      expect(clusters.length).toBe(2);
      expect(clusters[0].members.length).toBe(1);
      expect(clusters[1].members.length).toBe(1);
    });

    it("handles missing embeddings gracefully", () => {
      const vecA = createUnitVector(10, 0);

      const embeddings: PainPointEmbedding[] = [
        { painPointId: "a", description: "A", embedding: vecA },
        { painPointId: "b", description: "B", embedding: [] }, // Empty embedding
      ];

      const clusters = clusterPainPointsBySimilarity(embeddings, {
        similarityThreshold: 0.85,
      });

      // Should skip the one with empty embedding
      expect(clusters.length).toBe(2); // Each in own cluster
    });

    it("respects minClusterSize parameter", () => {
      const vecA = createUnitVector(10, 0);
      const vecB = createUnitVector(10, 1);

      const embeddings: PainPointEmbedding[] = [
        { painPointId: "a", description: "A", embedding: vecA },
        { painPointId: "b", description: "B", embedding: vecB },
      ];

      const clusters = clusterPainPointsBySimilarity(embeddings, {
        similarityThreshold: 0.85,
        minClusterSize: 2,
      });

      // Both are singletons, should be filtered out
      expect(clusters.length).toBe(0);
    });

    it("returns empty array for empty input", () => {
      const clusters = clusterPainPointsBySimilarity([]);
      expect(clusters).toEqual([]);
    });

    it("sorts clusters by size descending", () => {
      const base1 = createUnitVector(10, 0);
      const base2 = createUnitVector(10, 5);

      // Cluster 1: 3 similar points
      const vec1A = base1;
      const vec1B = createSimilarVectors(base1, 0.95);
      const vec1C = createSimilarVectors(base1, 0.90);

      // Cluster 2: 2 similar points
      const vec2A = base2;
      const vec2B = createSimilarVectors(base2, 0.95);

      const embeddings: PainPointEmbedding[] = [
        { painPointId: "1a", description: "1A", embedding: vec1A },
        { painPointId: "2a", description: "2A", embedding: vec2A },
        { painPointId: "1b", description: "1B", embedding: vec1B },
        { painPointId: "2b", description: "2B", embedding: vec2B },
        { painPointId: "1c", description: "1C", embedding: vec1C },
      ];

      const clusters = clusterPainPointsBySimilarity(embeddings, {
        similarityThreshold: 0.85,
      });

      expect(clusters.length).toBe(2);
      expect(clusters[0].members.length).toBe(3); // Larger cluster first
      expect(clusters[1].members.length).toBe(2);
    });
  });
});

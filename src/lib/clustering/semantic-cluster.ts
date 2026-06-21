/**
 * Semantic clustering engine using embedding similarity
 *
 * Algorithm:
 * 1. Build similarity graph using cosine similarity
 * 2. Find connected components using Union-Find
 * 3. Return clusters with members
 */

import type {
  PainPointEmbedding,
  SemanticCluster,
  ClusterMember,
  SimilarityEdge,
  ClusteringConfig,
} from "@/types/clustering";

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Union-Find data structure for connected components
 */
class UnionFind {
  private parent: Map<string, string>;
  private rank: Map<string, number>;

  constructor(ids: string[]) {
    this.parent = new Map();
    this.rank = new Map();

    for (const id of ids) {
      this.parent.set(id, id);
      this.rank.set(id, 0);
    }
  }

  find(id: string): string {
    const p = this.parent.get(id);
    if (!p) throw new Error(`ID not found: ${id}`);

    if (p !== id) {
      this.parent.set(id, this.find(p)); // Path compression
    }

    return this.parent.get(id)!;
  }

  union(idA: string, idB: string): void {
    const rootA = this.find(idA);
    const rootB = this.find(idB);

    if (rootA === rootB) return;

    const rankA = this.rank.get(rootA) ?? 0;
    const rankB = this.rank.get(rootB) ?? 0;

    // Union by rank
    if (rankA < rankB) {
      this.parent.set(rootA, rootB);
    } else if (rankA > rankB) {
      this.parent.set(rootB, rootA);
    } else {
      this.parent.set(rootB, rootA);
      this.rank.set(rootA, rankA + 1);
    }
  }
}

/**
 * Build similarity graph from embeddings
 */
function buildSimilarityGraph(
  embeddings: PainPointEmbedding[],
  threshold: number
): SimilarityEdge[] {
  const edges: SimilarityEdge[] = [];

  for (let i = 0; i < embeddings.length; i++) {
    for (let j = i + 1; j < embeddings.length; j++) {
      const similarity = cosineSimilarity(
        embeddings[i].embedding,
        embeddings[j].embedding
      );

      if (similarity >= threshold) {
        edges.push({
          painPointA: embeddings[i].painPointId,
          painPointB: embeddings[j].painPointId,
          similarity,
        });
      }
    }
  }

  return edges;
}

/**
 * Cluster pain points using semantic similarity
 *
 * @param embeddings - Pain points with their embedding vectors
 * @param config - Clustering configuration
 * @returns Array of semantic clusters
 */
export function clusterPainPointsBySimilarity(
  embeddings: PainPointEmbedding[],
  config: Partial<ClusteringConfig> = {}
): SemanticCluster[] {
  const { similarityThreshold = 0.85, minClusterSize = 1 } = config;

  if (embeddings.length === 0) {
    return [];
  }

  // Build similarity graph
  const edges = buildSimilarityGraph(embeddings, similarityThreshold);

  console.log(`Built similarity graph with ${edges.length} edges (threshold: ${similarityThreshold})`);

  // Use Union-Find to find connected components
  const painPointIds = embeddings.map((e) => e.painPointId);
  const uf = new UnionFind(painPointIds);

  for (const edge of edges) {
    uf.union(edge.painPointA, edge.painPointB);
  }

  // Group by root
  const groups = new Map<string, string[]>();

  for (const id of painPointIds) {
    const root = uf.find(id);
    if (!groups.has(root)) {
      groups.set(root, []);
    }
    groups.get(root)!.push(id);
  }

  // Build clusters
  const clusters: SemanticCluster[] = [];
  const embeddingMap = new Map(embeddings.map((e) => [e.painPointId, e]));

  for (const memberIds of groups.values()) {
    if (memberIds.length < minClusterSize) {
      continue;
    }

    // Calculate average similarity for each member
    const members: ClusterMember[] = memberIds.map((id) => {
      const memberEdges = edges.filter(
        (e) => e.painPointA === id || e.painPointB === id
      );
      const avgSimilarity =
        memberEdges.length > 0
          ? memberEdges.reduce((sum, e) => sum + e.similarity, 0) /
            memberEdges.length
          : 1.0; // Single node has perfect self-similarity

      return {
        painPointId: id,
        description: embeddingMap.get(id)!.description,
        similarity: avgSimilarity,
      };
    });

    // Sort by similarity descending
    members.sort((a, b) => b.similarity - a.similarity);

    clusters.push({ members });
  }

  // Sort clusters by size descending
  clusters.sort((a, b) => b.members.length - a.members.length);

  console.log(
    `Found ${clusters.length} semantic clusters (min size: ${minClusterSize})`
  );

  return clusters;
}

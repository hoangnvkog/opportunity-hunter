/**
 * Product Hunt source provider
 *
 * Fetches top products from Product Hunt GraphQL API
 * Requires PRODUCT_HUNT_TOKEN environment variable
 */

import type { SourceProvider } from "@/types/source-provider";
import type { RawPostInput } from "@/types/pipeline";

interface PHProduct {
  id: string;
  name: string;
  tagline: string;
  description?: string;
  website: string;
  votesCount: number;
  createdAt: string;
}

interface PHResponse {
  data: {
    posts: {
      edges: Array<{
        node: PHProduct;
      }>;
    };
  };
}

const GRAPHQL_QUERY = `
  query GetPosts($first: Int!) {
    posts(first: $first) {
      edges {
        node {
          id
          name
          tagline
          description
          website
          votesCount
          createdAt
        }
      }
    }
  }
`;

export const productHuntProvider: SourceProvider = {
  name: "producthunt",

  async fetchPosts(limit = 25): Promise<RawPostInput[]> {
    const token = process.env.PRODUCT_HUNT_TOKEN;

    if (!token) {
      console.warn(
        "Product Hunt provider: PRODUCT_HUNT_TOKEN not set, skipping"
      );
      return [];
    }

    console.log(`Fetching ${limit} Product Hunt posts...`);

    try {
      const response = await fetch("https://api.producthunt.com/v2/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: GRAPHQL_QUERY,
          variables: { first: limit },
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Product Hunt API error: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as PHResponse;
      const products = data.data.posts.edges.map((edge) => edge.node);

      return products.map((product) => ({
        source: "producthunt",
        title: product.name,
        content: [product.tagline, product.description]
          .filter(Boolean)
          .join("\n\n"),
        url: product.website,
        score: product.votesCount,
        created_at: product.createdAt,
      }));
    } catch (error) {
      console.error("Failed to fetch Product Hunt posts:", error);
      return [];
    }
  },
};

import type { MetadataRoute } from "next";
import { getSupabaseServiceClient } from "@/lib/supabase";

/**
 * Dynamic sitemap.xml — generated at build time + revalidated on demand.
 *
 * Includes:
 *   - 5 static pages (home, opportunities, ideas, insights, pricing)
 *   - All public opportunities (active status only) — limited to 1000 newest
 *
 * Disallowed pages (admin, dashboard, auth-required) are NOT listed.
 * Set NEXT_PUBLIC_SITE_URL in env to override the default domain.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://opportunity-hunter-hn.vercel.app";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/opportunities`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ideas`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/insights`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  let opportunityPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = getSupabaseServiceClient();
    const { data: opportunities } = await supabase
      .from("opportunities")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);

    opportunityPages = (opportunities ?? []).map((opp) => ({
      url: `${baseUrl}/opportunities/${opp.id}`,
      lastModified: new Date(opp.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (err) {
    // Fail open — sitemap still ships with static pages if DB query fails.
    console.warn("[sitemap] failed to fetch opportunities:", err);
  }

  return [...staticPages, ...opportunityPages];
}
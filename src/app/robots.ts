import type { MetadataRoute } from "next";

/**
 * robots.txt — tells crawlers which routes are indexable.
 *
 * Allowed:  /, /opportunities, /opportunities/[id], /ideas, /insights, /pricing
 * Disallowed: /admin/*, /api/*, /profile, /settings, /dashboard/*,
 *             /login, /signup, /saved, /watchlists, /alerts, /digests
 *             (these require authentication or are admin-only)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/opportunities", "/ideas", "/insights", "/pricing"],
        disallow: [
          "/admin/",
          "/api/",
          "/dashboard/",
          "/profile",
          "/settings",
          "/login",
          "/signup",
          "/saved",
          "/watchlists",
          "/alerts",
          "/digests",
        ],
      },
    ],
    sitemap: "https://opportunityhunter.app/sitemap.xml",
    host: "https://opportunityhunter.app",
  };
}
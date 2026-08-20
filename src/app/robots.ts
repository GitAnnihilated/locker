import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Native Next.js robots route (replaces a static public/robots.txt).
 * Disallows everything behind the (app) auth wall plus auth-flow utility
 * pages that carry no search intent of their own — the (app) layout also
 * sets `robots: noindex` per-page as defense in depth, since a crawler
 * that somehow reaches one of these (a stale/shared link, a JS-rendered
 * link Google follows anyway) should still be told not to index it even
 * if it ignores robots.txt.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        // Every authenticated app route lives in the (app) route group;
        // route groups don't appear in the URL, so list the real paths.
        "/dashboard",
        "/homework",
        "/marketplace",
        "/achievements",
        "/groups",
        "/rewards",
        "/messages",
        "/tasks",
        "/classes",
        "/class/",
        "/courses",
        "/assignments",
        "/project-groups",
        "/study-groups",
        "/campus-marketplace",
        "/notes",
        "/clubs",
        "/events",
        "/classmates",
        "/ptm",
        "/students",
        "/school/",
        "/settings",
        "/onboarding",
        "/profile",
        // Auth-flow utility pages — no independent search intent, and
        // reset-password/verify-email carry a ?email= query param that
        // has no business being indexed or appearing in Search Console.
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        // API routes are never a page a search result should land on.
        "/api/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

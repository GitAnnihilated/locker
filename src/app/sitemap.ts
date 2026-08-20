import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Native Next.js sitemap route. Lists ONLY canonical, publicly indexable
 * URLs — every one of these is server-rendered, has no auth gate, and has
 * its own unique title/description (see each route's `metadata` export).
 * Do not add a route here without also giving it real unique content;
 * a sitemap entry with thin/duplicate content is a Search Console demerit,
 * not a win.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/schools", priority: 0.9, changeFrequency: "monthly" },
    { path: "/features/homework", priority: 0.8, changeFrequency: "monthly" },
    { path: "/features/groups", priority: 0.8, changeFrequency: "monthly" },
    { path: "/features/marketplace", priority: 0.8, changeFrequency: "monthly" },
    { path: "/features/achievements", priority: 0.8, changeFrequency: "monthly" },
    { path: "/guide", priority: 0.6, changeFrequency: "monthly" },
    { path: "/creator", priority: 0.4, changeFrequency: "monthly" },
    { path: "/login", priority: 0.3, changeFrequency: "yearly" },
    { path: "/signup", priority: 0.5, changeFrequency: "yearly" },
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}

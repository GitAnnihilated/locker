import { SITE_URL } from "@/lib/seo";

/**
 * BreadcrumbList structured data for a feature/landing page. Genuinely
 * describes the page's position in the site (Home → … → this page) —
 * nothing fabricated, so it's safe to attach anywhere a page has a real
 * parent chain worth surfacing in search results.
 */
export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

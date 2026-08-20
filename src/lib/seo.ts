import type { Metadata } from "next";

/**
 * SEO METADATA HELPER
 * ------------------------------------------------------------------
 * One place that builds the title/description/canonical/OpenGraph/Twitter
 * block every public page needs, so individual pages just supply content
 * instead of re-deriving the same OG/Twitter shape each time. Mirrors the
 * "config data, not code" convention used elsewhere (see CLAUDE.md) —
 * adding a page's SEO metadata is a data literal, not new boilerplate.
 *
 * `path` must be root-relative (e.g. "/features/homework") — combined with
 * `metadataBase` (set once in the root layout from NEXT_PUBLIC_APP_URL) to
 * produce absolute canonical/OG urls.
 */
export function buildMetadata({
  title,
  description,
  path,
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: "Locker",
      type: "website",
      // Next's file-convention image resolution (opengraph-image.tsx)
      // only reliably applies to the exact segment it lives in — nested
      // static routes like /schools don't pick it up automatically, so
      // point at it explicitly (resolved against metadataBase).
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

/** Site-wide constants shared by structured data + metadata. */
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
export const SITE_NAME = "Locker";

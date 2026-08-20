import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/ui/styles/globals.css";
import { SITE_URL } from "@/lib/seo";

// Self-hosted via next/font: no external request, no layout shift, and the
// unused-glyph subsets are stripped at build time — the single biggest
// perf lever for a text-heavy app like this.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Locker — the shared brain of your class",
    template: "%s · Locker",
  },
  description:
    "Homework, groups, marketplace, achievements, and parent-teacher meetings — the collaboration layer for students, teachers, and Principals/IT Admins.",
  applicationName: "Locker",
  robots: { index: true, follow: true },
  openGraph: {
    siteName: "Locker",
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
  },
};

// Organization + WebSite structured data — accurate, no fabricated ratings
// or pricing. Emitted once here so every page carries it, rather than
// duplicating a <script> tag per route.
const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Locker",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description:
    "Locker is the collaboration layer for students, teachers, and school admins — homework, groups, a school marketplace, achievements, and parent-teacher meetings in one place.",
};

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Locker",
  url: SITE_URL,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F9F9FB" },
    { media: "(prefers-color-scheme: dark)", color: "#0C1018" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
        />
      </body>
    </html>
  );
}

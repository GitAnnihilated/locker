import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/ui/styles/globals.css";

// Self-hosted via next/font: no external request, no layout shift, and the
// unused-glyph subsets are stripped at build time — the single biggest
// perf lever for a text-heavy app like this.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Locker — the shared brain of your class",
    template: "%s · Locker",
  },
  description:
    "Homework, groups, marketplace, achievements, and parent-teacher meetings — the collaboration layer for students, teachers, and principals.",
  applicationName: "Locker",
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
      <body>{children}</body>
    </html>
  );
}

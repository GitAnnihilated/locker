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
    "Homework, marketplace, projects, and achievements — the daily tool built for students, not schools.",
  applicationName: "Locker",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7FAF8" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1512" },
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

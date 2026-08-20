import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { FeatureLanding, type FeatureLandingContent } from "@/modules/marketing/components/FeatureLanding";

export const metadata: Metadata = buildMetadata({
  title: "Student Marketplace — Buy & Sell Books and Gear",
  description:
    "Locker's student marketplace lets you buy and sell textbooks and gear within your own school — no fees, no strangers off-campus, just your own classmates.",
  path: "/features/marketplace",
});

const content: FeatureLandingContent = {
  path: "/features/marketplace",
  icon: "🛍️",
  eyebrow: "Marketplace",
  h1: "A student marketplace that stays inside your own school",
  intro:
    "Old textbooks, calculators, gear you outgrew — Locker's Marketplace is a buy-and-sell board scoped to your own school, so you're always dealing with someone you could just run into in the hallway.",
  bullets: [
    {
      title: "School-only, by design",
      description: "Listings never leave your own school — no browsing (or being found by) strangers off-campus.",
    },
    {
      title: "No fees, no middleman",
      description: "List what you're selling, agree on a price directly, no cut taken out of a student's sale.",
    },
    {
      title: "Built for what students actually trade",
      description: "Textbooks, calculators, uniforms, gear — the everyday resale that already happens informally, just easier to find.",
    },
  ],
  sections: [
    {
      heading: "Why a school-only marketplace works better than a general one",
      body: "A general classifieds site puts a student's textbook listing next to a stranger's used furniture, with all the trust and safety questions that come with meeting someone you've never seen before. Locker's Marketplace only ever shows listings from your own school, so buying or selling means dealing with someone already inside your shared community — a genuinely different trust model than an open marketplace app.",
    },
    {
      heading: "Part of the same class you already use for homework and groups",
      body: "Marketplace listings live next to the same class you're posting homework in and forming project groups with — one more reason Locker works as a single student hub rather than a separate app for every feature.",
    },
  ],
  related: [
    { href: "/features/homework", label: "Track class homework" },
    { href: "/features/groups", label: "Find a project group" },
    { href: "/schools", label: "Locker for schools" },
  ],
};

export default function MarketplaceFeaturePage() {
  return <FeatureLanding content={content} />;
}

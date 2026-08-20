import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { FeatureLanding, type FeatureLandingContent } from "@/modules/marketing/components/FeatureLanding";

export const metadata: Metadata = buildMetadata({
  title: "Student Achievements Portfolio",
  description:
    "Log competitions, certifications, and awards in one real portfolio with Locker's Achievements — verified by teachers, not just self-reported.",
  path: "/features/achievements",
});

const content: FeatureLandingContent = {
  path: "/features/achievements",
  icon: "🏅",
  eyebrow: "Achievements",
  h1: "A real portfolio of what you've actually earned",
  intro:
    "Competitions, certifications, awards — the things that happen outside class and usually live nowhere but a resume you write once, years later. Locker's Achievements keeps a running, teacher-verified record as you earn it.",
  bullets: [
    {
      title: "Log it when it happens",
      description: "Add a competition, certification, or award the moment you earn it — not months later when you're rebuilding a resume from memory.",
    },
    {
      title: "Verified, not just listed",
      description: "Teachers can verify or reject achievements from their own students, so the portfolio carries real credibility.",
    },
    {
      title: "One portfolio, always current",
      description: "Everything you've logged stays in one place — a running record instead of a scattered pile of certificates.",
    },
  ],
  sections: [
    {
      heading: "Why verified beats self-reported",
      body: "Anyone can list accomplishments on a resume. Locker's Achievements are reviewed by a student's actual teacher, who can verify or reject each entry directly from the class roster. That verification step is what turns a list of claims into a real, credible record — useful the moment a student needs to show what they've actually done, not just what they say they've done.",
    },
    {
      heading: "Built alongside Rewards, not instead of it",
      body: "Achievements are the real, external record — competitions and certifications from outside Locker. Rewards (points, streaks, badges) is a separate, lighter motivation layer inside the app. Locker keeps the two apart deliberately: one is a genuine credential, the other is a game layer that shouldn't be mistaken for one.",
    },
  ],
  related: [
    { href: "/features/homework", label: "Track class homework" },
    { href: "/features/groups", label: "Find a project group" },
    { href: "/schools", label: "Locker for schools" },
  ],
};

export default function AchievementsFeaturePage() {
  return <FeatureLanding content={content} />;
}

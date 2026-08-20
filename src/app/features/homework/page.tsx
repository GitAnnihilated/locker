import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { FeatureLanding, type FeatureLandingContent } from "@/modules/marketing/components/FeatureLanding";

export const metadata: Metadata = buildMetadata({
  title: "Homework Tracker for Students & Classes",
  description:
    "Locker's homework tracker is a shared assignment board for your class — post what's due, check it off, and never miss an assignment because you were out that day.",
  path: "/features/homework",
});

const content: FeatureLandingContent = {
  path: "/features/homework",
  icon: "📚",
  eyebrow: "Homework",
  h1: "A homework tracker your whole class actually keeps up to date",
  intro:
    "Most homework trackers are a to-do list for one person. Locker's is a shared board for the whole class — so it's only ever missing something if nobody in class knows about it either.",
  bullets: [
    {
      title: "Shared, not solo",
      description: "One assignment board per class. Whoever posts it first, everyone sees — no separate group chat needed.",
    },
    {
      title: "Miss a class, not the memo",
      description: "Homework posted while you're out is already waiting for you the next time you open Locker.",
    },
    {
      title: "Simple check-offs",
      description: "Mark assignments done as you finish them. No grading, no rubrics — just a clear view of what's left.",
    },
  ],
  sections: [
    {
      heading: "Why a shared homework tracker beats a personal one",
      body: "A student homework app that only you use is one more thing to remember to update. Locker's homework board lives at the class level: a teacher or classmate posts an assignment once, and it's visible to everyone in that class immediately. That single shared source removes the most common way homework gets missed — not forgetting to do it, but never hearing about it in the first place.",
    },
    {
      heading: "Built for real classes, not generic task lists",
      body: "Homework in Locker is scoped to your actual class, alongside the same group of classmates you already coordinate with for group projects and marketplace listings. It's one more reason Locker functions as a real student hub instead of a bundle of unrelated tools — homework, groups, and achievements all reference the same class and the same people.",
    },
  ],
  related: [
    { href: "/features/groups", label: "Find a project group" },
    { href: "/features/achievements", label: "Build your achievements portfolio" },
    { href: "/schools", label: "Locker for schools" },
  ],
};

export default function HomeworkFeaturePage() {
  return <FeatureLanding content={content} />;
}

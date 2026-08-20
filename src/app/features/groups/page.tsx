import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { FeatureLanding, type FeatureLandingContent } from "@/modules/marketing/components/FeatureLanding";

export const metadata: Metadata = buildMetadata({
  title: "Student Groups & Project Group Finder",
  description:
    "Find classmates for project and study groups with Locker's Group Finder — real workspaces with tasks, resources, and chat, not just a headcount.",
  path: "/features/groups",
});

const content: FeatureLandingContent = {
  path: "/features/groups",
  icon: "👥",
  eyebrow: "Group Finder",
  h1: "Find your group, then actually get the project done",
  intro:
    "Locker's Group Finder is student collaboration software for the part that usually happens over scattered texts — forming the group, dividing the work, and keeping track of what's left.",
  bullets: [
    {
      title: "Find classmates, not strangers",
      description: "Groups form within your own class or school — everyone in it is someone you already share homework and classes with.",
    },
    {
      title: "A real workspace, not a headcount",
      description: "Each group gets its own tasks and shared resources — closer to a lightweight project tool than a signup sheet.",
    },
    {
      title: "Study groups too",
      description: "Not every group is a project. Form a study group for an upcoming test just as easily.",
    },
  ],
  sections: [
    {
      heading: "Group work, minus the coordination tax",
      body: "The hard part of student group projects is rarely the project itself — it's finding people, agreeing on who does what, and keeping everyone on the same page afterward. Locker's Group Finder handles the forming and the follow-through: a group gets a shared space for tasks and resources the moment it exists, so coordination doesn't fall back on a group chat that half the group leaves on read.",
    },
    {
      heading: "Part of the same student platform as everything else",
      body: "Groups in Locker sit alongside Homework, Achievements, and Messages — the same student hub, not a separate tool with its own login. A group you form here can reference the same homework board and message the same classmates you already collaborate with elsewhere in Locker.",
    },
  ],
  related: [
    { href: "/features/homework", label: "Track class homework" },
    { href: "/features/marketplace", label: "Buy or sell in the school marketplace" },
    { href: "/schools", label: "Locker for schools" },
  ],
};

export default function GroupsFeaturePage() {
  return <FeatureLanding content={content} />;
}

/**
 * MODULE REGISTRY — the plug-in seam.
 *
 * Every feature (Homework, Marketplace, …) declares itself here. The app
 * shell renders navigation, dashboards, and feature-gates purely from this
 * list. Adding a future module (Clubs, Timetable, Notes, Events, Lost & Found)
 * means: create src/modules/<name>/ and append one entry here. No existing
 * file changes — that is the whole point.
 */

export type ModuleId =
  | "homework"
  | "marketplace"
  | "achievements"
  | "groups"
  | "badges"
  | "messages";

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  icon: string;
  href: string;
  description: string;
  /** Some modules only make sense once a class has enough members. */
  minClassMembers?: number;
  enabled: boolean;
}

export const MODULES: ModuleDefinition[] = [
  {
    id: "homework",
    name: "Homework",
    icon: "📚",
    href: "/homework",
    description: "The shared assignment board for your class.",
    enabled: true,
  },
  {
    id: "marketplace",
    name: "Marketplace",
    icon: "🛍️",
    href: "/marketplace",
    description: "Buy and sell books & gear within your school.",
    minClassMembers: 3, // liquidity gate — encourages inviting classmates
    enabled: true,
  },
  {
    id: "achievements",
    name: "Achievements",
    icon: "🏅",
    href: "/achievements",
    description: "Your portfolio of real-life accomplishments.",
    enabled: true,
  },
  {
    id: "groups",
    name: "Group Finder",
    icon: "👥",
    href: "/groups",
    description: "Find classmates for project groups.",
    enabled: true,
  },
  {
    id: "badges",
    name: "Badges",
    icon: "🎖️",
    href: "/badges",
    description: "Rewards for using Locker — streaks, milestones, firsts.",
    enabled: true,
  },
  {
    id: "messages",
    name: "Messages",
    icon: "💬",
    href: "/messages",
    description: "Direct messages with anyone in your school.",
    enabled: true,
  },
];

export const enabledModules = () => MODULES.filter((m) => m.enabled);

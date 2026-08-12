import type { EducationType, UserRole } from "@prisma/client";

/**
 * MODULE REGISTRY — the plug-in seam.
 *
 * Every feature (Homework, Marketplace, …) declares itself here. The app
 * shell renders navigation, dashboards, and feature-gates purely from this
 * list. Adding a future module (Clubs, Timetable, Notes, Events, Lost & Found)
 * means: create src/modules/<name>/ and append one entry here. No existing
 * file changes — that is the whole point.
 *
 * `educationTypes` is the College/School seam (see core/education/): a
 * module omitting it is shown to everyone (Achievements, Rewards, Messages
 * — genuinely shared). School-only and College-only modules declare which
 * EducationType(s) see them. This is the ONLY place that distinction is
 * made for navigation — nothing else in the app should be filtering nav
 * items by educationType ad hoc.
 */

export type ModuleId =
  | "homework"
  | "marketplace"
  | "achievements"
  | "groups"
  | "rewards"
  | "messages"
  | "courses"
  | "assignments"
  | "project-groups"
  | "study-groups"
  | "campus-marketplace"
  | "notes"
  | "clubs"
  | "events"
  | "classmates"
  | "ptm"
  | "tasks";

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  icon: string;
  href: string;
  description: string;
  /** Some modules only make sense once a class has enough members. */
  minClassMembers?: number;
  enabled: boolean;
  /** Which EducationType(s) see this in navigation. Omitted = shown to both. */
  educationTypes?: EducationType[];
  /** Which UserRole(s) see this in navigation. Omitted = shown to every role. */
  roles?: UserRole[];
}

export const MODULES: ModuleDefinition[] = [
  // ---- Shared (both SCHOOL and COLLEGE) ----
  {
    id: "achievements",
    name: "Achievements",
    icon: "🏅",
    href: "/achievements",
    description: "Your portfolio of real-life accomplishments.",
    enabled: true,
  },
  {
    id: "rewards",
    name: "Rewards",
    icon: "🏆",
    href: "/rewards",
    description: "Points, badges, streaks, and the perk store.",
    enabled: true,
    // Gamification is a student-motivation layer, not something a
    // teacher/principal's own account should be earning badges through.
    roles: ["STUDENT"],
  },
  {
    id: "messages",
    name: "Messages",
    icon: "💬",
    href: "/messages",
    description: "Direct messages with anyone in your school.",
    enabled: true,
  },
  {
    id: "tasks",
    name: "My Tasks",
    icon: "✅",
    href: "/tasks",
    description: "The ad hoc things people ask you to do.",
    enabled: true,
  },

  // ---- SCHOOL ----
  {
    id: "homework",
    name: "Homework",
    icon: "📚",
    href: "/homework",
    description: "The shared assignment board for your class.",
    enabled: true,
    educationTypes: ["SCHOOL"],
  },
  {
    id: "marketplace",
    name: "Marketplace",
    icon: "🛍️",
    href: "/marketplace",
    description: "Buy and sell books & gear within your school.",
    minClassMembers: 3, // liquidity gate — encourages inviting classmates
    enabled: true,
    educationTypes: ["SCHOOL"],
  },
  {
    id: "groups",
    name: "Group Finder",
    icon: "👥",
    href: "/groups",
    description: "Find classmates for project groups.",
    enabled: true,
    educationTypes: ["SCHOOL"],
  },
  {
    id: "ptm",
    name: "Parent-Teacher Meetings",
    icon: "🗓️",
    href: "/ptm",
    description: "Book or manage parent-teacher meeting slots.",
    enabled: true,
    educationTypes: ["SCHOOL"],
  },

  // ---- COLLEGE ----
  {
    id: "courses",
    name: "Courses",
    icon: "🎓",
    href: "/courses",
    description: "Your enrolled courses — assignments, resources, and discussions.",
    enabled: true,
    educationTypes: ["COLLEGE"],
  },
  {
    id: "assignments",
    name: "Assignments",
    icon: "📚",
    href: "/assignments",
    description: "Every assignment across your courses, in one board.",
    enabled: true,
    educationTypes: ["COLLEGE"],
  },
  {
    id: "project-groups",
    name: "Project Groups",
    icon: "👥",
    href: "/project-groups",
    description: "Team up with classmates to get a project done.",
    enabled: true,
    educationTypes: ["COLLEGE"],
  },
  {
    id: "study-groups",
    name: "Study Groups",
    icon: "📖",
    href: "/study-groups",
    description: "Find people to revise and learn with.",
    enabled: true,
    educationTypes: ["COLLEGE"],
  },
  {
    id: "campus-marketplace",
    name: "Campus Marketplace",
    icon: "🛍️",
    href: "/campus-marketplace",
    description: "Textbooks, dorm gear, and electronics from other students.",
    enabled: true,
    educationTypes: ["COLLEGE"],
  },
  {
    id: "notes",
    name: "Notes & Resources",
    icon: "📝",
    href: "/notes",
    description: "Shared notes, study guides, and course materials.",
    enabled: true,
    educationTypes: ["COLLEGE"],
  },
  {
    id: "clubs",
    name: "Clubs",
    icon: "🎭",
    href: "/clubs",
    description: "Discover and join clubs on campus.",
    enabled: true,
    educationTypes: ["COLLEGE"],
  },
  {
    id: "events",
    name: "Events",
    icon: "📅",
    href: "/events",
    description: "Workshops, hackathons, and campus happenings.",
    enabled: true,
    educationTypes: ["COLLEGE"],
  },
  {
    id: "classmates",
    name: "Classmates",
    icon: "🔍",
    href: "/classmates",
    description: "Find other students by name, course, or department.",
    enabled: true,
    educationTypes: ["COLLEGE"],
  },
];

export const enabledModules = (educationType: EducationType = "SCHOOL", role: UserRole = "STUDENT") =>
  MODULES.filter(
    (m) =>
      m.enabled &&
      (!m.educationTypes || m.educationTypes.includes(educationType)) &&
      (!m.roles || m.roles.includes(role)),
  );

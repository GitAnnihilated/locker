import type { EducationType } from "@prisma/client";

/**
 * The single place School-vs-College differences in copy/config live.
 * Nothing outside this file (and the module registry, which follows the
 * same "declare, don't branch" pattern) should ever string-match or
 * `if (user.educationType === "COLLEGE")` — pull a value from here instead.
 */
export interface EducationTerminology {
  orgUnit: string; // "School" | "College"
  classUnit: string; // "Class" | "Course"
  classUnitPlural: string; // "Classes" | "Courses"
  homeworkUnit: string; // "Homework" | "Assignments"
  groupsLabel: string; // "Group Finder" | "Project Groups"
  manageClassLabel: string; // "Manage class" | "Manage course"
  createClassCta: string; // "Create a class" | "Create a course"
  classCreatedRole: string; // what you become when you create one — "Class Founder" | "Course Founder"
}

const TERMINOLOGY: Record<EducationType, EducationTerminology> = {
  SCHOOL: {
    orgUnit: "School",
    classUnit: "Class",
    classUnitPlural: "Classes",
    homeworkUnit: "Homework",
    groupsLabel: "Group Finder",
    manageClassLabel: "Manage class",
    createClassCta: "Create a class",
    classCreatedRole: "Teacher",
  },
  COLLEGE: {
    orgUnit: "College",
    classUnit: "Course",
    classUnitPlural: "Courses",
    homeworkUnit: "Assignments",
    groupsLabel: "Project Groups",
    manageClassLabel: "Manage course",
    createClassCta: "Create a course",
    classCreatedRole: "Course Founder",
  },
};

export function getTerminology(type: EducationType): EducationTerminology {
  return TERMINOLOGY[type];
}

/**
 * Marketplace categories, config-driven per EducationType (never a DB
 * enum, so the list can change without a migration — same philosophy as
 * Rewards' Badge/Perk rows being data, not code). MarketplaceListing.category
 * is a free string; this is the UI's suggested/allowed set, not a DB constraint.
 */
const MARKETPLACE_CATEGORIES: Record<EducationType, string[]> = {
  SCHOOL: ["Textbooks", "Uniforms", "Stationery", "Electronics", "Sports gear", "Other"],
  COLLEGE: ["Textbooks", "Dorm items", "Electronics", "Furniture", "Notes & study guides", "Other"],
};

export function getMarketplaceCategories(type: EducationType): string[] {
  return MARKETPLACE_CATEGORIES[type];
}

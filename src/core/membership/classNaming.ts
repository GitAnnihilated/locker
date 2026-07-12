/**
 * Class names are composed from a fixed Grade + Section pair rather than
 * free text — keeps every class in a school named consistently (no "Grade
 * 10B" vs "10-B" vs "Tenth B" fragmenting what should be the same class).
 */
export const GRADE_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1)); // "1".."12"
export const SECTION_OPTIONS = ["A", "B", "C", "D", "E", "F"];

export function composeClassName(grade: string, section: string): string {
  return `Grade ${grade}-${section}`;
}

const NAME_PATTERN = /^Grade\s+(\d{1,2})-([A-Za-z])$/;

/** Best-effort split, so the rename dropdowns can default to an existing class's current grade/section. */
export function parseClassName(name: string): { grade: string; section: string } | null {
  const match = name.match(NAME_PATTERN);
  if (!match) return null;
  const [, grade, rawSection] = match;
  const section = rawSection.toUpperCase();
  if (!GRADE_OPTIONS.includes(grade) || !SECTION_OPTIONS.includes(section)) return null;
  return { grade, section };
}

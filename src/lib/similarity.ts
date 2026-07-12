/**
 * Lightweight fuzzy-match for catching near-duplicate school names ("Lincoln
 * High" vs "Lincoln High School" vs a typo'd "Linkoln High"). Plain
 * Levenshtein distance over a small candidate set — fine at this app's
 * current scale. If the schools table grows large, replace the candidate
 * fetch in core/school/actions.ts with a Postgres trigram search
 * (pg_trgm + similarity()) instead of widening this to scan everything.
 */

export function normalizeSchoolName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "") // strip punctuation ("St. Xavier's" -> "st xaviers")
    .replace(/\s+/g, " ");
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prevRow = Array.from({ length: b.length + 1 }, (_, j) => j);

  for (let i = 1; i <= a.length; i++) {
    const currRow = [i];
    for (let j = 1; j <= b.length; j++) {
      currRow[j] =
        a[i - 1] === b[j - 1]
          ? prevRow[j - 1]
          : 1 + Math.min(prevRow[j - 1], prevRow[j], currRow[j - 1]);
    }
    prevRow = currRow;
  }

  return prevRow[b.length];
}

/** 0 (nothing alike) to 1 (identical), after normalizing both strings. */
export function nameSimilarity(a: string, b: string): number {
  const na = normalizeSchoolName(a);
  const nb = normalizeSchoolName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;

  const distance = levenshteinDistance(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return 1 - distance / maxLen;
}

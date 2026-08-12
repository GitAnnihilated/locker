/**
 * Pure permission predicates — no I/O. Keeping these as plain functions over
 * plain data (not tied to Prisma types) means they're trivial to unit test
 * and reuse from both server actions and UI (e.g. hiding a button).
 *
 * Role model recap:
 *  - Global User.role (STUDENT/TEACHER/PRINCIPAL) gates who may CREATE a
 *    School or Class in the first place — see requireTeacher/requirePrincipal
 *    in guards.ts. It is a separate axis from everything below, which is
 *    about who governs a School/Class ONCE it exists.
 *  - School Founder: whoever created the School row (School.founderId) — for
 *    a SCHOOL-type institution this is always its PRINCIPAL, since only a
 *    Principal may create one. School-wide authority, INCLUDING an override
 *    into every class in their school — see canGovernClassAsSchool/
 *    canManageClassAsSchool below. A School Founder never needs to be a
 *    class member to manage that class.
 *  - School Moderator: assigned by the School Founder (SchoolModerator row).
 *    Can moderate spam across the whole school (remove classes) and gets the
 *    same day-to-day (non-governance) override into every class as a Class
 *    Moderator would — see canManageClassAsSchool.
 *  - Class Founder: whoever created the Class row (Class.founderId) — for a
 *    SCHOOL-type class this is always its TEACHER (Class.teacherId mirrors
 *    it), mirrored as Membership.role = FOUNDER for that class. Unlike
 *    COLLEGE, a SCHOOL class's Founder/teacher is fixed: no promoting a
 *    Class Moderator, and no transferring it to a student (see
 *    core/membership/actions.ts's promoteModerator/transferClassOwnership) —
 *    the teacher manages the class directly, full stop.
 *  - Class Moderator: COLLEGE only. Promoted by the Class Founder
 *    (Membership.role = MODERATOR).
 *  - COLLEGE classes ("courses") keep the pre-existing student-first, no
 *    gatekeeping model unchanged — role gating only applies to SCHOOL.
 */

export interface SchoolContext {
  founderId: string;
  moderatorUserIds: string[];
}

export interface ClassContext {
  founderId: string;
  moderatorUserIds: string[]; // Membership.role === MODERATOR for this class
}

export function isSchoolFounder(userId: string, school: SchoolContext): boolean {
  return school.founderId === userId;
}

export function isSchoolModerator(userId: string, school: SchoolContext): boolean {
  return school.moderatorUserIds.includes(userId);
}

/** School Founder + School Moderators can remove spam classes school-wide. */
export function canModerateSchool(userId: string, school: SchoolContext): boolean {
  return isSchoolFounder(userId, school) || isSchoolModerator(userId, school);
}

export function isClassFounder(userId: string, klass: ClassContext): boolean {
  return klass.founderId === userId;
}

export function isClassModerator(userId: string, klass: ClassContext): boolean {
  return klass.moderatorUserIds.includes(userId);
}

/** Class Founder + Class Moderators can manage class settings and members. */
export function canManageClass(userId: string, klass: ClassContext): boolean {
  return isClassFounder(userId, klass) || isClassModerator(userId, klass);
}

/** Only the Class Founder can promote/demote moderators, archive, or transfer. */
export function canGovernClass(userId: string, klass: ClassContext): boolean {
  return isClassFounder(userId, klass);
}

/**
 * Deliberately explicit: Class Founders/Moderators never get school-wide
 * settings access just by running a class. School authority is a separate
 * grant (School Founder or School Moderator only).
 */
export function canAccessSchoolSettings(
  userId: string,
  school: SchoolContext,
): boolean {
  return canModerateSchool(userId, school);
}

export function canEditSchoolInfo(userId: string, school: SchoolContext): boolean {
  return isSchoolFounder(userId, school);
}

export function canTransferSchoolOwnership(
  userId: string,
  school: SchoolContext,
): boolean {
  return isSchoolFounder(userId, school);
}

/**
 * School Founder override for class governance actions (rename, promote/
 * demote moderator, transfer ownership, archive) on ANY class in their
 * school — not just one they happen to be a member of.
 */
export function canGovernClassAsSchool(userId: string, school: SchoolContext): boolean {
  return isSchoolFounder(userId, school);
}

/**
 * School Founder + School Moderator override for day-to-day class
 * management (invite code, removing a member) on ANY class in their school.
 */
export function canManageClassAsSchool(userId: string, school: SchoolContext): boolean {
  return canModerateSchool(userId, school);
}

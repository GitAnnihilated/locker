import { db } from "@/core/db/client";
import { cosmeticPerksSelect } from "@/core/rewards/cosmetics";

// Matches groups/queries.ts's own memberSelect exactly — GroupCard (and
// other Group Finder components shared with School) already expect
// `perks` on every member.user they render, so this needs to carry it too
// even though a mini overlapping-avatar stack doesn't itself use it yet.
const groupMemberSelect = { id: true, name: true, nickname: true, image: true, perks: cosmeticPerksSelect } as const;

/**
 * A COLLEGE user's "courses" are just their Classes — a Class doubles as a
 * Course (see EducationType/Class.courseCode) — so this module adds NO new
 * enrollment table, only cross-course aggregation queries a school student
 * never needed (they only ever have one class at a time in practice).
 */

async function getMyClassIds(userId: string): Promise<string[]> {
  const rows = await db.membership.findMany({ where: { userId }, select: { classId: true } });
  return rows.map((r) => r.classId);
}

/** Every course the student is enrolled in, with a quick assignment/member count each. */
export async function getMyCourses(userId: string) {
  const memberships = await db.membership.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      class: {
        include: {
          teacher: { select: { id: true, name: true } },
          _count: { select: { memberships: true, homework: true } },
        },
      },
    },
  });
  return memberships
    .filter((m) => m.class.status === "ACTIVE" && !m.class.deletedAt)
    .map((m) => ({
      classId: m.classId,
      role: m.role,
      name: m.class.name,
      courseCode: m.class.courseCode,
      inviteCode: m.class.inviteCode,
      teacher: m.class.teacher,
      memberCount: m.class._count.memberships,
      assignmentCount: m.class._count.homework,
    }));
}

/** Assignments due (not yet done) across EVERY enrolled course — Dashboard's "Due" tile for College. */
export async function getPendingAssignmentsCount(userId: string): Promise<number> {
  const classIds = await getMyClassIds(userId);
  if (classIds.length === 0) return 0;
  return db.homework.count({
    where: {
      classId: { in: classIds },
      deletedAt: null,
      NOT: { statuses: { some: { userId, done: true } } },
    },
  });
}

/** Assignments across every enrolled course, joined with this user's done state and the course name. */
export async function getMyAssignments(userId: string) {
  const classIds = await getMyClassIds(userId);
  if (classIds.length === 0) return [];

  const items = await db.homework.findMany({
    where: { classId: { in: classIds }, deletedAt: null },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    include: {
      author: { select: { id: true, name: true, image: true } },
      class: { select: { id: true, name: true, courseCode: true } },
      statuses: { where: { userId }, select: { done: true } },
    },
  });

  return items.map((h) => ({
    id: h.id,
    title: h.title,
    description: h.description,
    subject: h.subject,
    dueAt: h.dueAt,
    author: h.author,
    course: h.class,
    confirmations: h.confirmations,
    done: h.statuses[0]?.done ?? false,
  }));
}

export type MyAssignment = Awaited<ReturnType<typeof getMyAssignments>>[number];

/** Groups of a given kind (PROJECT/STUDY) across every enrolled course. */
export async function getMyGroupsByKind(userId: string, kind: "PROJECT" | "STUDY") {
  const classIds = await getMyClassIds(userId);
  if (classIds.length === 0) return [];

  const groups = await db.group.findMany({
    where: {
      classId: { in: classIds },
      kind,
      deletedAt: null,
      status: { not: "ARCHIVED" },
      members: { some: { userId } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      class: { select: { id: true, name: true, courseCode: true } },
      members: { include: { user: { select: groupMemberSelect } } },
      _count: { select: { tasks: true } },
    },
  });
  return groups;
}

export type MyKindGroup = Awaited<ReturnType<typeof getMyGroupsByKind>>[number];

/** Count-only sibling of getMyGroupsByKind — for a Dashboard stat tile, never fetch full
 * member/task rows just to read `.length`. */
export async function getMyGroupCountByKind(userId: string, kind: "PROJECT" | "STUDY"): Promise<number> {
  const classIds = await getMyClassIds(userId);
  if (classIds.length === 0) return 0;
  return db.group.count({
    where: { classId: { in: classIds }, kind, deletedAt: null, status: { not: "ARCHIVED" }, members: { some: { userId } } },
  });
}

/** Discoverable groups of a kind within one specific course — for "find a study group in Physics 101". */
export async function getCourseGroups(classId: string, kind: "PROJECT" | "STUDY") {
  return db.group.findMany({
    where: { classId, kind, deletedAt: null, status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    include: {
      members: { include: { user: { select: groupMemberSelect } } },
      _count: { select: { tasks: true } },
    },
  });
}

/** A single course's detail-hub header info, with an authorization check baked in (must be a member) —
 * one query, not membership-check-then-class-fetch, since the membership row already carries
 * everything needed and Prisma can join the class straight off it. */
export async function getCourseForMember(classId: string, userId: string) {
  const membership = await db.membership.findUnique({
    where: { userId_classId: { userId, classId } },
    include: {
      class: {
        include: {
          teacher: { select: { id: true, name: true } },
          _count: { select: { memberships: true } },
        },
      },
    },
  });
  if (!membership) return null;

  const { class: klass, ...membershipRest } = membership;
  return { class: klass, membership: membershipRest };
}

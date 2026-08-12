import { db } from "@/core/db/client";
import { cosmeticPerksSelect, withCosmetics } from "@/core/rewards/cosmetics";

/**
 * One class's roster for its teacher, each student annotated with an
 * incomplete-homework count — the "who needs follow-up" surfacing the
 * teacher asked for, read straight off existing Homework/HomeworkStatus
 * data. No new table, no new logging required to get this for free.
 */
export async function getClassRosterWithFollowUp(classId: string) {
  const [members, homeworkIds] = await Promise.all([
    db.membership.findMany({
      where: { classId, role: { not: "FOUNDER" } }, // the teacher themself isn't "a student to follow up on"
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, name: true, image: true, perks: cosmeticPerksSelect } } },
    }),
    db.homework.findMany({ where: { classId, deletedAt: null }, select: { id: true } }),
  ]);

  const totalHomework = homeworkIds.length;
  if (totalHomework === 0) {
    return members.map((m) => ({ userId: m.userId, user: withCosmetics(m.user), incompleteCount: 0 }));
  }

  const doneCounts = await db.homeworkStatus.groupBy({
    by: ["userId"],
    where: { homeworkId: { in: homeworkIds.map((h) => h.id) }, userId: { in: members.map((m) => m.userId) }, done: true },
    _count: { _all: true },
  });
  const doneByUser = new Map(doneCounts.map((d) => [d.userId, d._count._all]));

  return members.map((m) => ({
    userId: m.userId,
    user: withCosmetics(m.user),
    incompleteCount: totalHomework - (doneByUser.get(m.userId) ?? 0),
  }));
}

/** Every homework item in the class, with this one student's done/not-done status — their follow-up detail view. */
export async function getStudentHomeworkHistory(classId: string, studentId: string) {
  const items = await db.homework.findMany({
    where: { classId, deletedAt: null },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    include: { statuses: { where: { userId: studentId }, select: { done: true } } },
  });
  return items.map((h) => ({
    id: h.id,
    title: h.title,
    subject: h.subject,
    dueAt: h.dueAt,
    done: h.statuses[0]?.done ?? false,
  }));
}

/** The observation log for one student in one class, newest first. */
export async function getStudentNotes(classId: string, studentId: string) {
  return db.studentNote.findMany({
    where: { classId, studentId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true } } },
  });
}

/** Achievements needing a teacher's attention — anything not yet VERIFIED. */
export async function getAchievementsToVerify(studentId: string) {
  return db.achievement.findMany({
    where: { userId: studentId, deletedAt: null, verificationStatus: { not: "VERIFIED" } },
    orderBy: { achievedOn: "desc" },
  });
}

/** Already-verified achievements — shown for context, not action. */
export async function getVerifiedAchievements(studentId: string) {
  return db.achievement.findMany({
    where: { userId: studentId, deletedAt: null, verificationStatus: "VERIFIED" },
    orderBy: { achievedOn: "desc" },
  });
}

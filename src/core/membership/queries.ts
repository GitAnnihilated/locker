import { db } from "@/core/db/client";
import { cosmeticPerksSelect, withCosmetics } from "@/core/rewards/cosmetics";

/**
 * Resolves the user's current class context. A user can belong to many
 * classes; for the MVP we use their most recently joined active one. Later
 * this becomes an explicit class switcher in the shell.
 */
export async function getActiveMembership(userId: string) {
  return db.membership.findFirst({
    where: { userId, class: { status: "ACTIVE", deletedAt: null } },
    orderBy: { createdAt: "desc" },
    include: { class: true },
  });
}

export async function getClassMemberCount(classId: string) {
  return db.membership.count({ where: { classId } });
}

export async function getMembership(userId: string, classId: string) {
  return db.membership.findUnique({
    where: { userId_classId: { userId, classId } },
  });
}

/** Full member roster for the class settings page (Founder/Moderator view). */
export async function getClassMembers(classId: string) {
  const members = await db.membership.findMany({
    where: { classId },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    include: {
      user: { select: { id: true, name: true, email: true, image: true, perks: cosmeticPerksSelect } },
    },
  });
  return members.map((m) => ({ ...m, user: withCosmetics(m.user) }));
}

import { db } from "@/core/db/client";

export async function getProfile(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      nickname: true,
      bio: true,
      image: true,
      email: true,
      createdAt: true,
    },
  });
}

export async function getProfileStats(userId: string) {
  const [achievementsCount, badgesCount, listingsCount] = await Promise.all([
    db.achievement.count({ where: { userId, deletedAt: null } }),
    db.badgeUnlock.count({ where: { userId } }),
    db.marketplaceListing.count({ where: { sellerId: userId, deletedAt: null } }),
  ]);

  return { achievementsCount, badgesCount, listingsCount };
}

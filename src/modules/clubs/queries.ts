import { db } from "@/core/db/client";
import { cosmeticPerksSelect, withCosmetics } from "@/core/rewards/cosmetics";

/** Every club at the student's school (college), with a member count and whether the viewer's already in it. */
export async function getSchoolClubs(schoolId: string, viewerId: string) {
  const clubs = await db.club.findMany({
    where: { schoolId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      founder: { select: { id: true, name: true } },
      members: { where: { userId: viewerId }, select: { id: true, role: true } },
      _count: { select: { members: true } },
    },
  });
  return clubs.map((c) => ({
    ...c,
    memberCount: c._count.members,
    isMember: c.members.length > 0,
    myRole: c.members[0]?.role ?? null,
  }));
}

export type SchoolClub = Awaited<ReturnType<typeof getSchoolClubs>>[number];

export async function getClubDetail(clubId: string, viewerId: string) {
  const club = await db.club.findUnique({
    where: { id: clubId },
    include: {
      founder: { select: { id: true, name: true, image: true } },
      members: {
        orderBy: { joinedAt: "asc" },
        include: {
          user: { select: { id: true, name: true, nickname: true, image: true, perks: cosmeticPerksSelect } },
        },
      },
      events: {
        where: { deletedAt: null, startAt: { gte: new Date() } },
        orderBy: { startAt: "asc" },
        take: 10,
      },
    },
  });
  if (!club || club.deletedAt) return null;

  const isMember = club.members.some((m) => m.userId === viewerId);
  return {
    ...club,
    isMember,
    members: club.members.map((m) => ({ ...m, user: withCosmetics(m.user) })),
  };
}

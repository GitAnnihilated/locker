import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Starter badges — data, not code, so more can be added without a deploy.
// These are platform engagement rewards, distinct from the Achievements
// module (which holds students' real-life accomplishments).
const BADGES = [
  { key: "first_join", name: "New Kid", description: "Joined your first class.", icon: "🚪", points: 10 },
  { key: "first_homework", name: "Contributor", description: "Added your first assignment.", icon: "✍️", points: 20 },
  { key: "streak_7", name: "On Fire", description: "7-day activity streak.", icon: "🔥", points: 50 },
  { key: "first_sale", name: "Entrepreneur", description: "Sold your first item.", icon: "💰", points: 30 },
  { key: "group_lead", name: "Team Captain", description: "Led a project group.", icon: "🧭", points: 40 },
  { key: "top_contributor", name: "Class Hero", description: "Most assignments added this month.", icon: "🦸", points: 100 },
];

async function main() {
  for (const b of BADGES) {
    await db.badge.upsert({
      where: { key: b.key },
      create: b,
      update: b,
    });
  }
  console.log(`Seeded ${BADGES.length} badges.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Fixed demo password for every seeded test account — dev/beta only, never
// used in production seeding (this script is not part of the deploy seed).
const DEMO_PASSWORD = "Locker@123";

function code(n = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const now = new Date();

  const principal = await db.user.upsert({
    where: { email: "principal@demo.locker" },
    update: {},
    create: {
      email: "principal@demo.locker",
      name: "Priya Principal",
      passwordHash,
      emailVerified: now,
      educationType: "SCHOOL",
      educationTypeSetAt: now,
      role: "PRINCIPAL",
      roleSetAt: now,
    },
  });

  const teacher = await db.user.upsert({
    where: { email: "teacher@demo.locker" },
    update: {},
    create: {
      email: "teacher@demo.locker",
      name: "Tara Teacher",
      passwordHash,
      emailVerified: now,
      educationType: "SCHOOL",
      educationTypeSetAt: now,
      role: "TEACHER",
      roleSetAt: now,
    },
  });

  const student1 = await db.user.upsert({
    where: { email: "student1@demo.locker" },
    update: {},
    create: {
      email: "student1@demo.locker",
      name: "Sam Student",
      passwordHash,
      emailVerified: now,
      educationType: "SCHOOL",
      educationTypeSetAt: now,
      role: "STUDENT",
      roleSetAt: now,
    },
  });

  const student2 = await db.user.upsert({
    where: { email: "student2@demo.locker" },
    update: {},
    create: {
      email: "student2@demo.locker",
      name: "Simi Student",
      passwordHash,
      emailVerified: now,
      educationType: "SCHOOL",
      educationTypeSetAt: now,
      role: "STUDENT",
      roleSetAt: now,
    },
  });

  // PRINCIPAL creates the school.
  let school = await db.school.upsert({
    where: { slug: "demo-high-school" },
    update: {},
    create: {
      name: "Demo High School",
      slug: "demo-high-school",
      founderId: principal.id,
      teacherInviteCode: code(),
    },
  });
  // In case this school already existed from a run before teacherInviteCode existed.
  if (!school.teacherInviteCode) {
    school = await db.school.update({ where: { id: school.id }, data: { teacherInviteCode: code() } });
  }

  // TEACHER redeems the school's staff code (required before creating/
  // joining any class — see requireSchoolStaff), then creates a class.
  // teacherId + founderId both point at the teacher, mirroring what
  // core/membership/actions.ts's createClass does for real users.
  await db.schoolTeacher.upsert({
    where: { schoolId_userId: { schoolId: school.id, userId: teacher.id } },
    update: {},
    create: { schoolId: school.id, userId: teacher.id },
  });

  let klass = await db.class.findFirst({ where: { schoolId: school.id, name: "Grade 10 - Section A" } });
  if (!klass) {
    klass = await db.class.create({
      data: {
        schoolId: school.id,
        founderId: teacher.id,
        teacherId: teacher.id,
        name: "Grade 10 - Section A",
        inviteCode: code(),
      },
    });
  }

  await db.membership.upsert({
    where: { userId_classId: { userId: teacher.id, classId: klass.id } },
    update: {},
    create: { userId: teacher.id, classId: klass.id, schoolId: school.id, role: "FOUNDER", verified: true },
  });

  // Subject now lives on ClassTeacher (a class has many subject teachers),
  // not on Class itself — see prisma/schema.prisma.
  await db.classTeacher.upsert({
    where: { classId_teacherId: { classId: klass.id, teacherId: teacher.id } },
    update: {},
    create: { classId: klass.id, teacherId: teacher.id, subject: "Mathematics" },
  });

  // STUDENTS join the class.
  for (const student of [student1, student2]) {
    await db.membership.upsert({
      where: { userId_classId: { userId: student.id, classId: klass.id } },
      update: {},
      create: { userId: student.id, classId: klass.id, schoolId: school.id, role: "STUDENT", verified: true },
    });
  }

  // TEACHER opens PTM slots for tomorrow, 10:00-10:30 in 10-minute slots.
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const slotWindows = [
    ["10:00", "10:10"],
    ["10:10", "10:20"],
    ["10:20", "10:30"],
  ];
  const slots: { id: string }[] = [];
  for (const [startTime, endTime] of slotWindows) {
    const slot = await db.pTMSlot.upsert({
      where: { teacherId_date_startTime: { teacherId: teacher.id, date: tomorrow, startTime } },
      update: {},
      create: { classId: klass.id, teacherId: teacher.id, date: tomorrow, startTime, endTime },
    });
    slots.push(slot);
  }

  // STUDENT 1 books the first slot, demonstrating the booking flow end to end.
  const firstSlot = await db.pTMSlot.findUnique({ where: { id: slots[0].id } });
  if (firstSlot && firstSlot.status === "AVAILABLE") {
    await db.$transaction([
      db.pTMBooking.create({ data: { slotId: firstSlot.id, bookedById: student1.id } }),
      db.pTMSlot.update({ where: { id: firstSlot.id }, data: { status: "BOOKED" } }),
    ]);
  }

  console.log("Demo accounts ready (password for all: %s):", DEMO_PASSWORD);
  console.log("  Principal: principal@demo.locker");
  console.log("  Teacher:   teacher@demo.locker");
  console.log("  Student 1: student1@demo.locker");
  console.log("  Student 2: student2@demo.locker");
  console.log("  School:", school.name, "| Class:", klass.name, "(Mathematics) | invite code:", klass.inviteCode);
  console.log("  School staff code:", school.teacherInviteCode);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

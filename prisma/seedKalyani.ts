/**
 * Seeds "The Kalyani School": one Principal, grades 2-10 x sections A-D
 * (36 classes total), and a demo Math teacher who joins a handful of them
 * across grades to demonstrate the "join any class in your school" +
 * compound-class features. Idempotent — safe to re-run.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEMO_PASSWORD = "Locker@123";
const GRADES = ["2", "3", "4", "5", "6", "7", "8", "9", "10"];
const SECTIONS = ["A", "B", "C", "D"];

function code(n = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const now = new Date();

  const principal = await db.user.upsert({
    where: { email: "principal@kalyani.locker" },
    update: {},
    create: {
      email: "principal@kalyani.locker",
      name: "Kalyani Principal",
      passwordHash,
      emailVerified: now,
      educationType: "SCHOOL",
      educationTypeSetAt: now,
      role: "PRINCIPAL",
      roleSetAt: now,
    },
  });

  const school = await db.school.upsert({
    where: { slug: "the-kalyani-school" },
    update: {},
    create: {
      name: "The Kalyani School",
      slug: "the-kalyani-school",
      founderId: principal.id,
      teacherInviteCode: code(),
    },
  });
  // In case this school already existed from a previous run without a code.
  if (!school.teacherInviteCode) {
    await db.school.update({ where: { id: school.id }, data: { teacherInviteCode: code() } });
  }

  const classesByName = new Map<string, { id: string; name: string }>();
  for (const grade of GRADES) {
    for (const section of SECTIONS) {
      const name = `Grade ${grade} - Section ${section}`;
      let klass = await db.class.findFirst({ where: { schoolId: school.id, name } });
      if (!klass) {
        klass = await db.class.create({
          data: {
            schoolId: school.id,
            founderId: principal.id, // the Principal set these up; individual teachers join afterward
            teacherId: principal.id,
            name,
            inviteCode: code(),
          },
        });
      }
      classesByName.set(name, klass);
    }
  }
  console.log(`Created/verified ${classesByName.size} classes (grades 2-10 x sections A-D).`);

  // A demo Math teacher who joins several classes across grades, showing
  // the school-scoped "join any class in their school" flow and a
  // compound class bundling the ones they teach Math to.
  const mathTeacher = await db.user.upsert({
    where: { email: "math.teacher@kalyani.locker" },
    update: {},
    create: {
      email: "math.teacher@kalyani.locker",
      name: "Meera Mathur",
      passwordHash,
      emailVerified: now,
      educationType: "SCHOOL",
      educationTypeSetAt: now,
      role: "TEACHER",
      roleSetAt: now,
    },
  });

  await db.schoolTeacher.upsert({
    where: { schoolId_userId: { schoolId: school.id, userId: mathTeacher.id } },
    update: {},
    create: { schoolId: school.id, userId: mathTeacher.id },
  });

  const mathClasses = ["Grade 10 - Section A", "Grade 10 - Section B", "Grade 10 - Section C", "Grade 10 - Section D"];
  for (const name of mathClasses) {
    const klass = classesByName.get(name)!;
    await db.classTeacher.upsert({
      where: { classId_teacherId: { classId: klass.id, teacherId: mathTeacher.id } },
      update: {},
      create: { classId: klass.id, teacherId: mathTeacher.id, subject: "Mathematics" },
    });
    await db.membership.upsert({
      where: { userId_classId: { userId: mathTeacher.id, classId: klass.id } },
      update: {},
      create: { userId: mathTeacher.id, classId: klass.id, schoolId: school.id, role: "TEACHER", verified: true },
    });
  }
  console.log(`${mathTeacher.name} joined ${mathClasses.length} Grade 10 sections as Mathematics teacher.`);

  const groupName = "Grade 10 Mathematics";
  const existingGroup = await db.classGroup.findFirst({ where: { schoolId: school.id, name: groupName } });
  if (!existingGroup) {
    await db.classGroup.create({
      data: {
        schoolId: school.id,
        name: groupName,
        createdById: mathTeacher.id,
        members: { create: mathClasses.map((name) => ({ classId: classesByName.get(name)!.id })) },
      },
    });
    console.log(`Created compound class "${groupName}" bundling ${mathClasses.length} sections.`);
  }

  // A couple of demo students, joined into Grade 10 - Section A.
  const homeroom = classesByName.get("Grade 10 - Section A")!;
  for (const [email, name] of [
    ["student1@kalyani.locker", "Aarav Shah"],
    ["student2@kalyani.locker", "Diya Nair"],
  ] as const) {
    const student = await db.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        passwordHash,
        emailVerified: now,
        educationType: "SCHOOL",
        educationTypeSetAt: now,
        role: "STUDENT",
        roleSetAt: now,
      },
    });
    await db.membership.upsert({
      where: { userId_classId: { userId: student.id, classId: homeroom.id } },
      update: {},
      create: { userId: student.id, classId: homeroom.id, schoolId: school.id, role: "STUDENT", verified: true },
    });
  }

  console.log("\nThe Kalyani School is ready (password for all: %s):", DEMO_PASSWORD);
  console.log("  Principal:     principal@kalyani.locker");
  console.log("  Math teacher:  math.teacher@kalyani.locker (Grade 10, all 4 sections)");
  console.log("  Students:      student1@kalyani.locker, student2@kalyani.locker (Grade 10 - Section A)");
  console.log("  School staff code (share with other teachers):", school.teacherInviteCode ?? "(already set on an earlier run)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

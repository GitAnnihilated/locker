import Link from "next/link";
import { requireDbUser } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { Card, CardBody, CardHeader } from "@/ui/components/Card";
import { getSchool, getSchoolClasses } from "@/core/school/queries";
import { getTerminology } from "@/core/education/config";
import { EducationTypeForm } from "./_components/EducationTypeForm";
import { RoleSelectForm } from "./_components/RoleSelectForm";
import { SchoolSearch } from "./_components/SchoolSearch";
import { CreateSchoolForm } from "./_components/CreateSchoolForm";
import { CreateClassForm } from "./_components/CreateClassForm";
import { CreateCourseForm } from "./_components/CreateCourseForm";
import { JoinByCodeForm } from "./_components/JoinByCodeForm";
import { JoinSchoolStaffForm } from "./_components/JoinSchoolStaffForm";

/**
 * Onboarding, now up to four steps for a first-time signup (each is skipped
 * entirely for anyone who's already chosen — including every pre-existing
 * account, which defaults to SCHOOL/STUDENT and never sees it again unless
 * they explicitly ask via Settings):
 *   0. Where are you studying? — School or College/University.
 *   1. SCHOOL only: are you a Student, Teacher, or Principal/IT Admin?
 *      (College keeps its original student-first model unchanged — no role
 *      gate there.)
 *   2. Find (or create) your school — a Principal/IT Admin creates one;
 *      everyone else can only search/join, since a school is a real
 *      institution now, and creating one is behind a paywall (see
 *      CreateSchoolForm/createSchool).
 *   3. Create a class there (Teachers/Principals only) or join one with a code.
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ school?: string }>;
}) {
  const user = await requireDbUser();
  const { school: schoolId } = await searchParams;
  const t = getTerminology(user.educationType);
  const isCollege = user.educationType === "COLLEGE";
  const canCreateSchool = isCollege || user.role === "PRINCIPAL";
  const canCreateClass = isCollege || user.role === "TEACHER" || user.role === "PRINCIPAL";

  if (!user.educationTypeSetAt) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Where are you studying?</h1>
          <p className="mt-1 text-sm text-subtle">
            This shapes your whole Locker experience — you can change it later in Settings.
          </p>
        </div>
        <EducationTypeForm />
      </div>
    );
  }

  if (!isCollege && !user.roleSetAt) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">What's your role at school?</h1>
          <p className="mt-1 text-sm text-subtle">
            This decides what you can create — you can&apos;t change it yourself later, so pick carefully.
          </p>
        </div>
        <RoleSelectForm />
      </div>
    );
  }

  if (schoolId) {
    const school = await getSchool(schoolId);
    if (school) {
      const classes = await getSchoolClasses(schoolId);

      // A TEACHER (not the Principal) needs a redeemed staff code before
      // they can create or join any class here — this is the actual gate
      // behind "join any class in their school, but not any school."
      // Principals are always implicitly staff of their own school.
      const needsStaffCode =
        !isCollege &&
        user.role === "TEACHER" &&
        school.founderId !== user.id &&
        !(await db.schoolTeacher.findUnique({ where: { schoolId_userId: { schoolId: school.id, userId: user.id } } }));

      return (
        <div className="mx-auto max-w-md space-y-6">
          <div className="text-center">
            <Link href="/onboarding" className="text-xs text-subtle hover:underline">
              ← Choose a different {t.orgUnit.toLowerCase()}
            </Link>
            <h1 className="mt-2 text-2xl font-bold">{school.name}</h1>
            <p className="mt-1 text-sm text-subtle">
              {classes.length > 0
                ? `${classes.length} ${t.classUnit.toLowerCase()}${classes.length === 1 ? "" : "s"} already here.`
                : `Be the first ${t.classUnit.toLowerCase()} here.`}
            </p>
          </div>

          {needsStaffCode && (
            <Card>
              <CardHeader className="font-semibold">Join as staff</CardHeader>
              <CardBody>
                <p className="mb-3 text-sm text-subtle">
                  Ask {school.name}&apos;s Principal/IT Admin for its staff code — you&apos;ll need it before you can
                  create or join any class here.
                </p>
                <JoinSchoolStaffForm />
              </CardBody>
            </Card>
          )}

          {canCreateClass && !needsStaffCode && (
            <>
              <Card>
                <CardHeader className="font-semibold">{t.createClassCta}</CardHeader>
                <CardBody>
                  <p className="mb-3 text-sm text-subtle">
                    You&apos;ll be the {t.classCreatedRole} — you get an invite code and
                    link to share with {isCollege ? "classmates" : "your students"} right away.
                  </p>
                  {isCollege ? <CreateCourseForm schoolId={school.id} /> : <CreateClassForm schoolId={school.id} />}
                </CardBody>
              </Card>

              <div className="text-center text-xs uppercase tracking-wide text-subtle">
                or
              </div>
            </>
          )}

          <Card>
            <CardHeader className="font-semibold">Join with a code</CardHeader>
            <CardBody>
              <p className="mb-3 text-sm text-subtle">
                {t.classUnitPlural} are private — ask a {isCollege ? "classmate" : "teacher"} for their invite code or link.
              </p>
              <JoinByCodeForm />
            </CardBody>
          </Card>
        </div>
      );
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Find your {t.orgUnit.toLowerCase()}</h1>
        <p className="mt-1 text-sm text-subtle">
          Got an invite code instead? Skip straight to joining below.
        </p>
      </div>

      <Card>
        <CardHeader className="font-semibold">Search {t.orgUnit.toLowerCase()}s</CardHeader>
        <CardBody className="space-y-3">
          <SchoolSearch orgUnit={t.orgUnit} classUnit={t.classUnit} classUnitPlural={t.classUnitPlural} />
          {canCreateSchool ? (
            <div className="border-t border-border pt-3">
              <p className="mb-2 text-xs font-medium text-subtle">
                {isCollege
                  ? `Can't find your college? You'll be its founder.`
                  : `Can't find your school? You'll be its Principal/IT Admin.`}
              </p>
              <CreateSchoolForm orgUnit={t.orgUnit} classUnit={t.classUnit} classUnitPlural={t.classUnitPlural} />
            </div>
          ) : (
            <p className="border-t border-border pt-3 text-xs text-subtle">
              Can&apos;t find your school? Ask your school&apos;s Principal/IT Admin to set it up on Locker first.
            </p>
          )}
        </CardBody>
      </Card>

      <div className="text-center text-xs uppercase tracking-wide text-subtle">
        or
      </div>

      <Card>
        <CardHeader className="font-semibold">Join with a code</CardHeader>
        <CardBody>
          <JoinByCodeForm />
        </CardBody>
      </Card>
    </div>
  );
}

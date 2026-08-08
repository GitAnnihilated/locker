import Link from "next/link";
import { requireDbUser } from "@/core/auth/session";
import { Card, CardBody, CardHeader } from "@/ui/components/Card";
import { getSchool, getSchoolClasses } from "@/core/school/queries";
import { getTerminology } from "@/core/education/config";
import { EducationTypeForm } from "./_components/EducationTypeForm";
import { SchoolSearch } from "./_components/SchoolSearch";
import { CreateSchoolForm } from "./_components/CreateSchoolForm";
import { CreateClassForm } from "./_components/CreateClassForm";
import { CreateCourseForm } from "./_components/CreateCourseForm";
import { JoinByCodeForm } from "./_components/JoinByCodeForm";

/**
 * Student-first onboarding, now three steps for a first-time signup (the
 * first is skipped entirely for anyone who's already chosen — including
 * every pre-existing account, which defaults to SCHOOL and never sees it
 * unless they explicitly ask via Settings):
 *   0. Where are you studying? — School or College/University.
 *   1. Find (or create) your school — findable the moment any student makes it.
 *   2. Create a class/course there (you become its Founder) or join one with a code.
 * A student never has to wait on anyone's approval to start using Locker.
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

  if (schoolId) {
    const school = await getSchool(schoolId);
    if (school) {
      const classes = await getSchoolClasses(schoolId);
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

          <Card>
            <CardHeader className="font-semibold">{t.createClassCta}</CardHeader>
            <CardBody>
              <p className="mb-3 text-sm text-subtle">
                You&apos;ll be the {t.classCreatedRole} — you get an invite code and
                link to share with classmates right away.
              </p>
              {isCollege ? <CreateCourseForm schoolId={school.id} /> : <CreateClassForm schoolId={school.id} />}
            </CardBody>
          </Card>

          <div className="text-center text-xs uppercase tracking-wide text-subtle">
            or
          </div>

          <Card>
            <CardHeader className="font-semibold">Join with a code</CardHeader>
            <CardBody>
              <p className="mb-3 text-sm text-subtle">
                {t.classUnitPlural} are private — ask a classmate for their invite code or link.
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
          Got an invite code from a classmate instead? Skip straight to joining below.
        </p>
      </div>

      <Card>
        <CardHeader className="font-semibold">Search {t.orgUnit.toLowerCase()}s</CardHeader>
        <CardBody className="space-y-3">
          <SchoolSearch orgUnit={t.orgUnit} classUnit={t.classUnit} classUnitPlural={t.classUnitPlural} />
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-medium text-subtle">
              Can&apos;t find your {t.orgUnit.toLowerCase()}? You&apos;ll be its founder.
            </p>
            <CreateSchoolForm orgUnit={t.orgUnit} classUnit={t.classUnit} classUnitPlural={t.classUnitPlural} />
          </div>
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

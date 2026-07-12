import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/ui/components/Card";
import { getSchool, getSchoolClasses } from "@/core/school/queries";
import { SchoolSearch } from "./_components/SchoolSearch";
import { CreateSchoolForm } from "./_components/CreateSchoolForm";
import { CreateClassForm } from "./_components/CreateClassForm";
import { JoinByCodeForm } from "./_components/JoinByCodeForm";

/**
 * Student-first onboarding. Two steps, neither gated by anyone's approval:
 *   1. Find (or create) your school — findable the moment any student makes it.
 *   2. Create a class there (you become Class Founder) or join one with a code.
 * A student never has to wait on a school admin to start using Locker.
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ school?: string }>;
}) {
  const { school: schoolId } = await searchParams;

  if (schoolId) {
    const school = await getSchool(schoolId);
    if (school) {
      const classes = await getSchoolClasses(schoolId);
      return (
        <div className="mx-auto max-w-md space-y-6">
          <div className="text-center">
            <Link href="/onboarding" className="text-xs text-subtle hover:underline">
              ← Choose a different school
            </Link>
            <h1 className="mt-2 text-2xl font-bold">{school.name}</h1>
            <p className="mt-1 text-sm text-subtle">
              {classes.length > 0
                ? `${classes.length} class${classes.length === 1 ? "" : "es"} already here.`
                : "Be the first class here."}
            </p>
          </div>

          <Card>
            <CardHeader className="font-semibold">Create a class</CardHeader>
            <CardBody>
              <p className="mb-3 text-sm text-subtle">
                You&apos;ll be the Class Founder — you get an invite code and
                link to share with classmates right away.
              </p>
              <CreateClassForm schoolId={school.id} />
            </CardBody>
          </Card>

          <div className="text-center text-xs uppercase tracking-wide text-subtle">
            or
          </div>

          <Card>
            <CardHeader className="font-semibold">Join with a code</CardHeader>
            <CardBody>
              <p className="mb-3 text-sm text-subtle">
                Classes are private — ask a classmate for their invite code or link.
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
        <h1 className="text-2xl font-bold">Find your school</h1>
        <p className="mt-1 text-sm text-subtle">
          Got an invite code from a classmate instead? Skip straight to joining below.
        </p>
      </div>

      <Card>
        <CardHeader className="font-semibold">Search schools</CardHeader>
        <CardBody className="space-y-3">
          <SchoolSearch />
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-medium text-subtle">
              Can&apos;t find your school? You&apos;ll be its founder.
            </p>
            <CreateSchoolForm />
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

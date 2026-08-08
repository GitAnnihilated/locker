import { requireUser } from "@/core/auth/session";
import { getMyCoursesForFilter } from "@/modules/classmates/queries";
import { ClassmateSearch } from "@/modules/classmates/components/ClassmateSearch";

export default async function ClassmatesPage() {
  const user = await requireUser();
  const courses = await getMyCoursesForFilter(user.id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Classmates</h1>
        <p className="text-sm text-subtle">Find other students by name or course.</p>
      </div>
      <ClassmateSearch courses={courses} />
    </div>
  );
}

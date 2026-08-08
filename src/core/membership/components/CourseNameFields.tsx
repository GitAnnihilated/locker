import { Input, Label } from "@/ui/components/Input";

/** Free-text course name + optional code — College's equivalent of GradeSectionSelect. */
export function CourseNameFields({
  defaultName,
  defaultCourseCode,
}: {
  defaultName?: string;
  defaultCourseCode?: string;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="name">Course name</Label>
        <Input id="name" name="name" defaultValue={defaultName ?? ""} placeholder="e.g. Physics 101" required />
      </div>
      <div>
        <Label htmlFor="courseCode">Course code (optional)</Label>
        <Input
          id="courseCode"
          name="courseCode"
          defaultValue={defaultCourseCode ?? ""}
          placeholder="e.g. PHYS101"
          className="uppercase"
        />
      </div>
    </div>
  );
}

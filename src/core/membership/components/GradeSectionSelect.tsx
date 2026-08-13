import { Input, Select, Label } from "@/ui/components/Input";
import { GRADE_OPTIONS, SECTION_OPTIONS } from "../classNaming";

/**
 * Grade + Section dropdowns — replaces free-typing a class name. The
 * subject field is only shown at creation time via `showSubject` — it's
 * not a property of the class (a class has many subject teachers, see
 * ClassTeacher), it's the subject THIS teacher personally teaches here.
 */
export function GradeSectionSelect({
  defaultGrade,
  defaultSection,
  showSubject = false,
  defaultSubject,
}: {
  defaultGrade?: string;
  defaultSection?: string;
  showSubject?: boolean;
  defaultSubject?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="grade">Grade</Label>
          <Select id="grade" name="grade" defaultValue={defaultGrade ?? ""} required>
            <option value="" disabled>
              Select grade
            </option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="section">Section</Label>
          <Select id="section" name="section" defaultValue={defaultSection ?? ""} required>
            <option value="" disabled>
              Select section
            </option>
            {SECTION_OPTIONS.map((s) => (
              <option key={s} value={s}>
                Section {s}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {showSubject && (
        <div>
          <Label htmlFor="subject">Subject you teach</Label>
          <Input id="subject" name="subject" placeholder="e.g. Mathematics" defaultValue={defaultSubject ?? ""} required />
          <p className="mt-1 text-xs text-faint">
            Other teachers can join this same class later and label their own subject.
          </p>
        </div>
      )}
    </div>
  );
}

import { Select, Label } from "@/ui/components/Input";
import { GRADE_OPTIONS, SECTION_OPTIONS } from "../classNaming";

/** Grade + Section dropdowns — replaces free-typing a class name. */
export function GradeSectionSelect({
  defaultGrade,
  defaultSection,
}: {
  defaultGrade?: string;
  defaultSection?: string;
}) {
  return (
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
  );
}

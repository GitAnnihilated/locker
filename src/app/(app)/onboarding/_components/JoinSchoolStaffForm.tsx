"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";
import { joinSchoolAsTeacher } from "@/core/school/actions";

/** A teacher redeems their Principal's staff code before they can create/join any class here. */
export function JoinSchoolStaffForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(fd) =>
        start(async () => {
          setError(null);
          const result = await joinSchoolAsTeacher(fd);
          if ("error" in result) setError(result.error);
          else router.refresh();
        })
      }
    >
      <div className="flex gap-2">
        <Input name="code" placeholder="Staff code from your Principal/IT Admin" required className="uppercase" />
        <Button type="submit" disabled={pending}>
          {pending ? "Joining…" : "Join"}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </form>
  );
}

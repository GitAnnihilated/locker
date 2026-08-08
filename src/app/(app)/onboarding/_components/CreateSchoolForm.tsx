"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";
import { Badge } from "@/ui/components/Badge";
import { createSchool, findSimilarSchools } from "@/core/school/actions";
import type { SchoolSearchResult } from "@/core/school/queries";

/**
 * No approval step: submitting this makes the student the School Founder
 * immediately. But first, a fuzzy "did you mean one of these?" check —
 * catches typos and near-duplicate names before a second copy of the same
 * school gets created. Skips straight to creating when nothing's similar,
 * so the common case stays one click.
 */
export function CreateSchoolForm({
  orgUnit = "School",
  classUnit = "class",
  classUnitPlural = "classes",
}: {
  orgUnit?: string;
  classUnit?: string;
  classUnitPlural?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [similar, setSimilar] = useState<SchoolSearchResult[] | null>(null);
  const orgLower = orgUnit.toLowerCase();

  async function doCreate() {
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    try {
      const result = await createSchool(fd);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push(`/onboarding?school=${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  function handleCheck() {
    setError(null);
    if (name.trim().length < 2) {
      setError(`Enter a ${orgLower} name`);
      return;
    }
    start(async () => {
      const matches = await findSimilarSchools(name);
      if (matches.length > 0) {
        setSimilar(matches);
      } else {
        await doCreate();
      }
    });
  }

  if (similar) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-subtle">
          Found {similar.length} {orgLower}{similar.length === 1 ? "" : "s"} with a similar name — is it one of these?
        </p>

        <div className="space-y-2">
          {similar.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => router.push(`/onboarding?school=${s.id}`)}
              className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left text-sm transition duration ease hover:border-accent"
            >
              <span className="font-medium">{s.name}</span>
              <Badge tone="neutral">
                {s.classCount} {s.classCount === 1 ? classUnit.toLowerCase() : classUnitPlural.toLowerCase()}
              </Badge>
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => setSimilar(null)}>
            Back
          </Button>
          <Button type="button" disabled={pending} onClick={() => start(doCreate)} className="flex-1">
            {pending ? "Creating…" : "None of these — create mine"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <Input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={orgUnit === "College" ? "e.g. State University" : "e.g. Lincoln High School"}
          required
        />
        <Button type="button" variant="secondary" disabled={pending} onClick={handleCheck}>
          {pending ? "Checking…" : `Create ${orgLower}`}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

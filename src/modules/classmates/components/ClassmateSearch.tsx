"use client";

import { useEffect, useState, useTransition } from "react";
import { Avatar } from "@/ui/components/Avatar";
import { CosmeticName } from "@/ui/components/CosmeticName";
import { Input, Select } from "@/ui/components/Input";
import { Button } from "@/ui/components/Button";
import { searchClassmates } from "../actions";
import { getOrCreateConversation } from "@/modules/messages/actions";
import type { Classmate } from "../queries";

/** Debounced, server-filtered — same 300ms pattern as onboarding's SchoolSearch. Never loads a full roster client-side. */
export function ClassmateSearch({ courses }: { courses: { id: string; name: string; courseCode: string | null }[] }) {
  const [query, setQuery] = useState("");
  const [courseId, setCourseId] = useState("");
  const [results, setResults] = useState<Classmate[]>([]);
  const [pending, start] = useTransition();
  const [messaging, startMessage] = useTransition();
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      start(async () => {
        const r = await searchClassmates(query, courseId || undefined);
        setResults(r);
        setSearched(true);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, courseId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Search by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        {courses.length > 0 && (
          <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="sm:w-56">
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.courseCode ?? c.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      {pending && <p className="text-sm text-subtle">Searching…</p>}

      {!pending && searched && results.length === 0 && (
        <p className="text-sm text-subtle">No classmates found.</p>
      )}

      <div className="space-y-2">
        {results.map((r) => {
          const name = r.nickname || r.name || "Student";
          const courseLabel = r.memberships[0]?.class ? (r.memberships[0].class.courseCode ?? r.memberships[0].class.name) : null;
          return (
            <div key={r.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={name} image={r.image} size={32} frame={r.avatarFrame} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    <CosmeticName color={r.nameColor}>{name}</CosmeticName>
                  </p>
                  {courseLabel && <p className="truncate text-xs text-subtle">{courseLabel}</p>}
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={messaging}
                onClick={() =>
                  startMessage(async () => {
                    await getOrCreateConversation(r.id);
                  })
                }
              >
                Message
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

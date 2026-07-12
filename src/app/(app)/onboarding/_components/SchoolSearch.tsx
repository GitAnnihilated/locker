"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Input } from "@/ui/components/Input";
import { Badge } from "@/ui/components/Badge";
import { searchSchools } from "@/core/school/actions";
import type { SchoolSearchResult } from "@/core/school/queries";

/**
 * Live, debounced school search. No approval queue, no admin allowlist — any
 * school a student has created is instantly findable here.
 */
export function SchoolSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SchoolSearchResult[]>([]);
  const [pending, start] = useTransition();
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    const timer = setTimeout(() => {
      start(async () => {
        const r = await searchSchools(query);
        setResults(r);
        setSearched(true);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <Input
        placeholder="Search for your school…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {pending && <p className="mt-2 text-sm text-subtle">Searching…</p>}

      {!pending && results.length > 0 && (
        <div className="mt-3 space-y-2">
          {results.map((s) => (
            <Link
              key={s.id}
              href={`/onboarding?school=${s.id}`}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm transition hover:border-accent"
            >
              <span className="font-medium">{s.name}</span>
              <Badge tone="neutral">
                {s.classCount} class{s.classCount === 1 ? "" : "es"}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {!pending && searched && results.length === 0 && (
        <p className="mt-2 text-sm text-subtle">
          No school found for &quot;{query}&quot;. Create it below.
        </p>
      )}
    </div>
  );
}

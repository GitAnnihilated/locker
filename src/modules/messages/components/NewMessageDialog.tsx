"use client";

import { useEffect, useState, useTransition } from "react";
import { Modal } from "@/ui/components/Modal";
import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";
import { Avatar } from "@/ui/components/Avatar";
import { searchSchoolUsers, getOrCreateConversation } from "../actions";
import { isRedirectError } from "@/lib/isRedirectError";

type Person = { id: string; name: string; nickname: string | null; image: string | null };

/** "New message" people picker — search is scoped server-side to the viewer's own school(s). */
export function NewMessageDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [searching, startSearch] = useTransition();
  const [opening, startOpen] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      startSearch(async () => {
        setResults(await searchSchoolUsers(trimmed));
      });
    }, 200);
    return () => clearTimeout(handle);
  }, [query, open]);

  function pick(personId: string) {
    setError(null);
    startOpen(async () => {
      try {
        const result = await getOrCreateConversation(personId);
        if (result?.error) setError(result.error);
      } catch (e) {
        if (isRedirectError(e)) throw e; // success — let the redirect happen
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        New message
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="New message">
        <Input
          autoFocus
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
          {searching && <p className="py-4 text-center text-sm text-subtle">Searching…</p>}

          {!searching && query.trim() && results.length === 0 && (
            <p className="py-4 text-center text-sm text-subtle">No one found in your school.</p>
          )}

          {!searching &&
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={opening}
                onClick={() => pick(p.id)}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition duration ease hover:bg-muted disabled:opacity-50"
              >
                <Avatar name={p.nickname || p.name} image={p.image} size={32} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.nickname || p.name}</p>
                  {p.nickname && <p className="truncate text-2xs text-faint">{p.name}</p>}
                </div>
              </button>
            ))}
        </div>
      </Modal>
    </>
  );
}

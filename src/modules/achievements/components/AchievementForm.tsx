"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input, Label, Select, Textarea } from "@/ui/components/Input";
import { createAchievement, updateAchievement } from "../actions";
import { CATEGORY_META, LEVEL_META, VISIBILITY_META } from "../meta";
import type { PortfolioAchievement } from "../queries";
import type { AchievementCategory, AchievementLevel, Visibility } from "@prisma/client";

/** Shared by the "add achievement" sidebar and the inline edit-in-place card form. */
export function AchievementForm({
  achievement,
  onDone,
}: {
  achievement?: PortfolioAchievement;
  onDone?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(achievement);

  return (
    <form
      ref={formRef}
      action={(fd) =>
        start(async () => {
          setError(null);
          try {
            const result = achievement
              ? await updateAchievement(achievement.id, fd)
              : await createAchievement(fd);
            if (result?.error) {
              setError(result.error);
              return;
            }
            if (!achievement) formRef.current?.reset();
            onDone?.();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong");
          }
        })
      }
      className="space-y-3"
    >
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g. National Chemistry Olympiad — Gold"
          defaultValue={achievement?.title}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select id="category" name="category" defaultValue={achievement?.category ?? "OTHER"} required>
            {(Object.keys(CATEGORY_META) as AchievementCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c].icon} {CATEGORY_META[c].label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="level">Level</Label>
          <Select id="level" name="level" defaultValue={achievement?.level ?? "SCHOOL"} required>
            {(Object.keys(LEVEL_META) as AchievementLevel[]).map((l) => (
              <option key={l} value={l}>
                {LEVEL_META[l].label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="achievedOn">Date</Label>
        <Input
          id="achievedOn"
          name="achievedOn"
          type="date"
          defaultValue={achievement ? toDateInputValue(achievement.achievedOn) : undefined}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="What was it, what did you do…"
          defaultValue={achievement?.description ?? undefined}
        />
      </div>

      <div>
        <Label htmlFor="certificateUrl">Certificate link (optional)</Label>
        <Input
          id="certificateUrl"
          name="certificateUrl"
          type="url"
          placeholder="https://…"
          defaultValue={achievement?.certificateUrl ?? undefined}
        />
      </div>
      <div>
        <Label htmlFor="photoUrl">Photo link (optional)</Label>
        <Input
          id="photoUrl"
          name="photoUrl"
          type="url"
          placeholder="https://…"
          defaultValue={achievement?.photoUrl ?? undefined}
        />
      </div>
      <div>
        <Label htmlFor="link">Reference link (optional)</Label>
        <Input
          id="link"
          name="link"
          type="url"
          placeholder="https://… (results page, article, etc.)"
          defaultValue={achievement?.link ?? undefined}
        />
      </div>

      <div>
        <Label htmlFor="visibility">Visibility</Label>
        <Select id="visibility" name="visibility" defaultValue={achievement?.visibility ?? "PUBLIC"} required>
          {(Object.keys(VISIBILITY_META) as Visibility[]).map((v) => (
            <option key={v} value={v}>
              {VISIBILITY_META[v].label}
            </option>
          ))}
        </Select>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? "Saving…" : isEdit ? "Save changes" : "Add achievement"}
        </Button>
        {isEdit && (
          <Button type="button" variant="secondary" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function toDateInputValue(date: Date): string {
  return new Date(date).toISOString().slice(0, 10);
}

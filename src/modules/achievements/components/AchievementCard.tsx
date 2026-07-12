"use client";

import { useState, useTransition } from "react";
import { Card, CardBody } from "@/ui/components/Card";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { CATEGORY_META, LEVEL_META, VISIBILITY_META } from "../meta";
import { deleteAchievement } from "../actions";
import { AchievementForm } from "./AchievementForm";
import type { PortfolioAchievement } from "../queries";

const LEVEL_TONE = {
  SCHOOL: "neutral",
  INTER_SCHOOL: "neutral",
  DISTRICT: "accent",
  STATE: "accent",
  NATIONAL: "success",
  INTERNATIONAL: "success",
} as const;

export function AchievementCard({ achievement }: { achievement: PortfolioAchievement }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const category = CATEGORY_META[achievement.category];
  const level = LEVEL_META[achievement.level];

  if (editing) {
    return (
      <Card>
        <CardBody>
          <AchievementForm achievement={achievement} onDone={() => setEditing(false)} />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-lg">
              {category.icon}
            </div>
            <div>
              <p className="font-semibold leading-tight">{achievement.title}</p>
              <p className="mt-0.5 text-xs text-subtle">
                {category.label} · {new Date(achievement.achievedOn).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                })}
              </p>
            </div>
          </div>
          <Badge tone={LEVEL_TONE[achievement.level]}>{level.label}</Badge>
        </div>

        {achievement.description && (
          <p className="mt-3 text-sm text-subtle">{achievement.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          {achievement.certificateUrl && (
            <a href={achievement.certificateUrl} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
              Certificate
            </a>
          )}
          {achievement.photoUrl && (
            <a href={achievement.photoUrl} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
              Photo
            </a>
          )}
          {achievement.link && (
            <a href={achievement.link} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
              Reference
            </a>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-subtle">
            {VISIBILITY_META[achievement.visibility].label}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={pending}
              onClick={() => {
                if (!confirm("Remove this achievement?")) return;
                start(() => deleteAchievement(achievement.id));
              }}
            >
              Remove
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

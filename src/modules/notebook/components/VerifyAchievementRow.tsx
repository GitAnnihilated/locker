"use client";

import { useTransition } from "react";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { verifyAchievement, rejectAchievement } from "../actions";

type Achievement = {
  id: string;
  title: string;
  category: string;
  level: string;
  achievedOn: Date;
  verificationStatus: string;
};

export function VerifyAchievementRow({ achievement, classId }: { achievement: Achievement; classId: string }) {
  const [pending, start] = useTransition();

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border p-3.5">
      <div className="min-w-0">
        <p className="font-medium">{achievement.title}</p>
        <p className="text-xs text-subtle">
          {achievement.category} · {achievement.level.replaceAll("_", " ")} ·{" "}
          {new Date(achievement.achievedOn).toLocaleDateString()}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {achievement.verificationStatus === "REJECTED" && <Badge tone="danger">Rejected</Badge>}
        <Button
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => start(async () => { await rejectAchievement(achievement.id, classId); })}
        >
          Reject
        </Button>
        <Button
          size="sm"
          disabled={pending}
          onClick={() => start(async () => { await verifyAchievement(achievement.id, classId); })}
        >
          Verify
        </Button>
      </div>
    </li>
  );
}

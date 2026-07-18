"use client";

import { useState } from "react";
import { Avatar } from "@/ui/components/Avatar";
import { Button } from "@/ui/components/Button";
import { CosmeticName } from "@/ui/components/CosmeticName";
import type { EquippedCosmetics } from "@/core/rewards/queries";
import { EditProfileForm } from "./EditProfileForm";

export function ProfileHeader({
  profile,
  cosmetics,
}: {
  profile: {
    name: string | null;
    nickname: string | null;
    bio: string | null;
    image: string | null;
    email: string;
    createdAt: Date;
  };
  cosmetics?: EquippedCosmetics;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <EditProfileForm profile={profile} onDone={() => setEditing(false)} />;
  }

  return (
    <div className="flex items-start gap-4">
      <Avatar name={profile.name} image={profile.image} size={72} frame={cosmetics?.avatarFrame} />
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold">
          <CosmeticName color={cosmetics?.nameColor}>{profile.name}</CosmeticName>
        </h1>
        {profile.nickname && <p className="text-sm text-subtle">&quot;{profile.nickname}&quot;</p>}
        {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
        <p className="mt-2 text-xs text-subtle">
          Joined{" "}
          {new Date(profile.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
          })}
        </p>
      </div>
      <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
        Edit profile
      </Button>
    </div>
  );
}

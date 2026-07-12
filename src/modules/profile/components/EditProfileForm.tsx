"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input, Label, Textarea } from "@/ui/components/Input";
import { updateProfile } from "../actions";

export function EditProfileForm({
  profile,
  onDone,
}: {
  profile: { name: string | null; nickname: string | null; bio: string | null; image: string | null };
  onDone: () => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(fd) =>
        start(async () => {
          setError(null);
          try {
            await updateProfile(fd);
            onDone();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong");
          }
        })
      }
      className="space-y-3"
    >
      <div>
        <Label htmlFor="name">Real full name</Label>
        <Input id="name" name="name" defaultValue={profile.name ?? ""} required />
      </div>
      <div>
        <Label htmlFor="nickname">Nickname</Label>
        <Input id="nickname" name="nickname" defaultValue={profile.nickname ?? ""} />
      </div>
      <div>
        <Label htmlFor="bio">Biography</Label>
        <Textarea id="bio" name="bio" defaultValue={profile.bio ?? ""} placeholder="A short intro" />
      </div>
      <div>
        <Label htmlFor="image">Profile picture URL</Label>
        <Input id="image" name="image" type="url" defaultValue={profile.image ?? ""} placeholder="https://…" />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

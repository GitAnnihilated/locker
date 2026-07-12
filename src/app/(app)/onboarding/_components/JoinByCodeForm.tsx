"use client";

import { useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";
import { joinClassByCode } from "@/core/membership/actions";

export function JoinByCodeForm() {
  const [pending, start] = useTransition();

  return (
    <form action={(fd) => start(() => joinClassByCode(fd))} className="flex gap-2">
      <Input name="code" placeholder="ABC123" className="uppercase" required />
      <Button type="submit" disabled={pending}>
        {pending ? "Joining…" : "Join"}
      </Button>
    </form>
  );
}

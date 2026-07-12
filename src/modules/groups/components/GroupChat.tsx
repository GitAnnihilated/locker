"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Card, CardHeader } from "@/ui/components/Card";
import { Avatar } from "@/ui/components/Avatar";
import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";
import { cn } from "@/lib/cn";
import { getGroupMessages, sendGroupMessage, type GroupChatMessage } from "../chat";

const POLL_MS = 3000;

/**
 * Polled, not pushed — there's no websocket/realtime infra in this app, so
 * a short client-side interval is the honest, bounded way to approximate
 * live chat without standing up new always-on infrastructure.
 */
export function GroupChat({
  groupId,
  viewerId,
  initialMessages,
}: {
  groupId: string;
  viewerId: string;
  initialMessages: GroupChatMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [pending, start] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const lastIdRef = useRef(initialMessages.at(-1)?.id);

  useEffect(() => {
    const interval = setInterval(async () => {
      const fresh = await getGroupMessages(groupId);
      // skip the re-render entirely when nothing actually changed
      if (fresh.at(-1)?.id !== lastIdRef.current || fresh.length !== messages.length) {
        lastIdRef.current = fresh.at(-1)?.id;
        setMessages(fresh);
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [groupId, messages.length]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  return (
    <Card>
      <CardHeader className="font-semibold">Chat</CardHeader>

      <div ref={listRef} className="max-h-80 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-subtle">No messages yet — say hi.</p>
        ) : (
          messages.map((m) => {
            const mine = m.authorId === viewerId;
            const name = m.author.nickname || m.author.name || "Member";
            return (
              <div key={m.id} className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
                <Avatar name={name} image={m.author.image} size={26} />
                <div
                  className={cn(
                    "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                    mine ? "bg-accent text-accent-fg" : "bg-muted",
                  )}
                >
                  {!mine && (
                    <p className="mb-0.5 text-2xs font-semibold text-subtle">{name}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        ref={formRef}
        action={(fd) =>
          start(async () => {
            const content = String(fd.get("content") ?? "").trim();
            if (!content) return;
            formRef.current?.reset();
            await sendGroupMessage(groupId, fd);
            const fresh = await getGroupMessages(groupId);
            lastIdRef.current = fresh.at(-1)?.id;
            setMessages(fresh);
          })
        }
        className="flex gap-2 border-t border-border p-3"
      >
        <Input name="content" placeholder="Message your team…" autoComplete="off" maxLength={2000} required />
        <Button type="submit" size="sm" disabled={pending}>
          Send
        </Button>
      </form>
    </Card>
  );
}

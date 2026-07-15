"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader } from "@/ui/components/Card";
import { Avatar } from "@/ui/components/Avatar";
import { Button } from "@/ui/components/Button";
import { cn } from "@/lib/cn";
import { getGroupMessages, sendGroupMessage, type GroupChatMessage } from "../chat";

const POLL_MS = 3000;
// How close to the bottom (px) counts as "already caught up" — new messages
// only auto-scroll the view if the reader was already about here.
const NEAR_BOTTOM_PX = 80;
const TOAST_MS = 4000;
const TEXTAREA_MAX_PX = 120;

type OptimisticMessage = GroupChatMessage & {
  tempId: string;
  status: "sending" | "failed";
};

/**
 * Polled, not pushed — there's no websocket/realtime infra in this app, so
 * a short client-side interval is the honest, bounded way to approximate
 * live chat without standing up new always-on infrastructure.
 *
 * Sending is optimistic: the bubble appears and the input clears the
 * instant Send is pressed, before the network round-trip resolves. The poll
 * only exists to pick up *other* members' messages — the sender's own
 * message is reconciled directly from sendGroupMessage's response, so it
 * never has to wait for the next tick.
 */
export function GroupChat({
  groupId,
  viewerId,
  viewerName,
  viewerImage,
  initialMessages,
}: {
  groupId: string;
  viewerId: string;
  viewerName?: string | null;
  viewerImage?: string | null;
  initialMessages: GroupChatMessage[];
}) {
  const [messages, setMessages] = useState<GroupChatMessage[]>(initialMessages);
  const [pending, setPending] = useState<OptimisticMessage[]>([]);
  const [text, setText] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastIdRef = useRef(initialMessages.at(-1)?.id);
  // Read via ref (not state) so a same-tick double Enter/click sees the
  // just-cleared value instead of a stale closure — avoids double-sends.
  const sendingRef = useRef(false);
  const nearBottomRef = useRef(true);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ---- poll for messages from other members ----
  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(async () => {
      // Skip while the tab is backgrounded — no point spending the request.
      if (document.visibilityState === "hidden") return;
      try {
        const fresh = await getGroupMessages(groupId);
        if (cancelled) return;
        // Skip the re-render entirely when nothing actually changed.
        if (fresh.at(-1)?.id !== lastIdRef.current || fresh.length !== messages.length) {
          lastIdRef.current = fresh.at(-1)?.id;
          setMessages(fresh);
        }
      } catch {
        // Transient network/auth blip — the next tick retries on its own.
        // A single missed poll isn't worth interrupting anyone with a toast.
      }
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [groupId, messages.length]);

  // ---- auto-scroll, but only if the reader was already near the bottom ----
  useEffect(() => {
    const el = listRef.current;
    if (!el || !nearBottomRef.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    return () => clearTimeout(toastTimerRef.current);
  }, []);

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  }

  function showToast(message: string) {
    setToast(message);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_MS);
  }

  function resizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_PX)}px`;
  }

  async function attemptSend(content: string, tempId: string) {
    const fd = new FormData();
    fd.set("content", content);

    let result: Awaited<ReturnType<typeof sendGroupMessage>>;
    try {
      result = await sendGroupMessage(groupId, fd);
    } catch {
      // A genuinely unexpected failure (offline, dropped connection mid-flight).
      result = { error: "Couldn't reach the server. Check your connection." };
    }

    if ("error" in result) {
      setPending((prev) => prev.map((m) => (m.tempId === tempId ? { ...m, status: "failed" } : m)));
      showToast(result.error);
      return;
    }

    lastIdRef.current = result.message.id;
    setPending((prev) => prev.filter((m) => m.tempId !== tempId));
    setMessages((prev) => (prev.some((m) => m.id === result.message.id) ? prev : [...prev, result.message]));
  }

  function handleSend() {
    const el = textareaRef.current;
    if (!el) return;
    const content = el.value.trim();
    if (!content || sendingRef.current) return;

    // Clear the real DOM value synchronously — a second Enter/click firing
    // in the same tick reads this, not a stale React state closure.
    el.value = "";
    el.style.height = "auto";
    setText("");
    sendingRef.current = true;
    // Sending is always "my" action — reveal it even if the reader had
    // scrolled up to read history.
    nearBottomRef.current = true;

    const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic: OptimisticMessage = {
      id: tempId,
      tempId,
      groupId,
      authorId: viewerId,
      content,
      createdAt: new Date(),
      deletedAt: null,
      author: { id: viewerId, name: viewerName ?? "You", nickname: null, image: viewerImage ?? null },
      status: "sending",
    };
    setPending((prev) => [...prev, optimistic]);

    void attemptSend(content, tempId).finally(() => {
      sendingRef.current = false;
    });
  }

  function retry(m: OptimisticMessage) {
    setPending((prev) => prev.map((p) => (p.tempId === m.tempId ? { ...p, status: "sending" } : p)));
    void attemptSend(m.content, m.tempId);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const visible = [...messages, ...pending];

  return (
    <Card className="relative">
      <CardHeader className="font-semibold">Chat</CardHeader>

      <div ref={listRef} onScroll={handleScroll} className="max-h-80 space-y-3 overflow-y-auto p-4">
        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-subtle">No messages yet — say hi.</p>
        ) : (
          visible.map((m) => {
            const key: string =
              "tempId" in m ? (m as OptimisticMessage).tempId : (m as GroupChatMessage).id;
            const mine = m.authorId === viewerId;
            const name = m.author.nickname || m.author.name || "Member";
            const failed = "status" in m && m.status === "failed";
            const sending = "status" in m && m.status === "sending";
            return (
              <div key={key} className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
                <Avatar name={name} image={m.author.image} size={26} />
                <div className={cn("flex flex-col", mine && "items-end")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                      mine ? "bg-accent text-accent-fg" : "bg-muted",
                      sending && "opacity-60",
                      failed && "bg-danger-soft text-danger opacity-90",
                    )}
                  >
                    {!mine && (
                      <p className="mb-0.5 text-2xs font-semibold text-subtle">{name}</p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  </div>
                  {failed && (
                    <button
                      type="button"
                      onClick={() => retry(m as OptimisticMessage)}
                      className="mt-1 text-2xs font-medium text-danger hover:underline"
                    >
                      Failed to send — tap to retry
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {toast && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[4.25rem] flex justify-center px-3">
          <div className="animate-fade-up pointer-events-auto flex items-center gap-2 rounded-lg bg-danger px-3 py-2 text-xs font-medium text-white shadow-lg">
            <span aria-hidden="true">⚠️</span>
            {toast}
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-1 opacity-80 transition duration ease hover:opacity-100"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 border-t border-border p-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            resizeTextarea();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Message your team…"
          rows={1}
          maxLength={2000}
          className="max-h-[120px] min-h-10 flex-1 resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-faint outline-none transition duration ease hover:border-border-strong focus:border-accent focus:ring-2 focus:ring-accent/15"
        />
        <Button type="button" size="sm" disabled={!text.trim()} onClick={handleSend}>
          Send
        </Button>
      </div>
    </Card>
  );
}

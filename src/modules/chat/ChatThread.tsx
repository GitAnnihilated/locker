"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/ui/components/Avatar";
import { Button } from "@/ui/components/Button";
import { cn } from "@/lib/cn";
import { useRealtimeChat, type OptimisticMessage } from "./useRealtimeChat";
import type { ChatMessage, SendResult } from "./types";

const TEXTAREA_MAX_PX = 120;

/**
 * Presentational chat UI shared by Group Chat and Direct Messages — all the
 * realtime/optimistic/scroll logic lives in useRealtimeChat, this just
 * renders it. `emptyLabel` is the only thing callers usually need to
 * customize ("No messages yet — say hi." vs. "Send the first message.").
 */
export function ChatThread({
  channelTopic,
  viewerId,
  viewerName,
  viewerImage,
  initialMessages,
  sendAction,
  refetchMessages,
  emptyLabel = "No messages yet — say hi.",
  placeholder = "Type a message…",
}: {
  channelTopic: string;
  viewerId: string;
  viewerName?: string | null;
  viewerImage?: string | null;
  initialMessages: ChatMessage[];
  sendAction: (content: string) => Promise<SendResult>;
  refetchMessages: () => Promise<ChatMessage[]>;
  emptyLabel?: string;
  placeholder?: string;
}) {
  const { messages, pending, toast, listRef, handleScroll, sendMessage, retry, dismissToast } = useRealtimeChat({
    channelTopic,
    viewerId,
    viewerName,
    viewerImage,
    initialMessages,
    sendAction,
    refetchMessages,
  });

  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function resizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_PX)}px`;
  }

  function handleSendClick() {
    const el = textareaRef.current;
    if (!el) return;
    const content = el.value;
    if (!content.trim()) return;
    // Clear the real DOM value synchronously — a second Enter/click firing
    // in the same tick reads this, not a stale React state closure.
    el.value = "";
    el.style.height = "auto";
    setText("");
    sendMessage(content);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  }

  const visible = [...messages, ...pending];

  return (
    <div className="relative flex flex-col">
      <div ref={listRef} onScroll={handleScroll} className="max-h-80 space-y-3 overflow-y-auto p-4">
        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-subtle">{emptyLabel}</p>
        ) : (
          visible.map((m) => {
            const key: string = "tempId" in m ? (m as OptimisticMessage).tempId : (m as ChatMessage).id;
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
                    {!mine && <p className="mb-0.5 text-2xs font-semibold text-subtle">{name}</p>}
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
              onClick={dismissToast}
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
          placeholder={placeholder}
          rows={1}
          maxLength={2000}
          className="max-h-[120px] min-h-10 flex-1 resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-faint outline-none transition duration ease hover:border-border-strong focus:border-accent focus:ring-2 focus:ring-accent/15"
        />
        <Button type="button" size="sm" disabled={!text.trim()} onClick={handleSendClick}>
          Send
        </Button>
      </div>
    </div>
  );
}

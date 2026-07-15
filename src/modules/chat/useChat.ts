"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, SendResult } from "./types";

const POLL_MS = 3000;
// How close to the bottom (px) counts as "already caught up" — new messages
// only auto-scroll the view if the reader was already about here.
const NEAR_BOTTOM_PX = 80;
const TOAST_MS = 4000;

export type OptimisticMessage = ChatMessage & {
  tempId: string;
  status: "sending" | "failed";
};

/**
 * Shared chat engine for both Group Chat and Direct Messages.
 *
 * Polled, not pushed — there's no realtime infra in this app, so a short
 * client-side interval is the honest, bounded way to approximate live chat
 * without standing up new always-on infrastructure. Polling pauses while
 * the tab is backgrounded and skips re-renders when nothing changed.
 *
 * Sending is optimistic: the bubble and cleared input happen before the
 * network call resolves; the server action's response (or a caught error)
 * reconciles it. The sender's own message is reconciled directly from the
 * action's response, never waiting on the next poll tick.
 */
export function useChat({
  viewerId,
  viewerName,
  viewerImage,
  initialMessages,
  sendAction,
  refetchMessages,
}: {
  viewerId: string;
  viewerName?: string | null;
  viewerImage?: string | null;
  initialMessages: ChatMessage[];
  sendAction: (content: string) => Promise<SendResult>;
  refetchMessages: () => Promise<ChatMessage[]>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [pending, setPending] = useState<OptimisticMessage[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const nearBottomRef = useRef(true);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastIdRef = useRef(initialMessages.at(-1)?.id);
  // Poll compares against the latest count via a ref, not the `messages`
  // dependency directly, so the interval doesn't get torn down and
  // recreated on every tick.
  const messagesLengthRef = useRef(initialMessages.length);
  messagesLengthRef.current = messages.length;

  // ---- poll for messages from other participants ----
  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(async () => {
      // Skip while the tab is backgrounded — no point spending the request.
      if (document.visibilityState === "hidden") return;
      try {
        const fresh = await refetchMessages();
        if (cancelled) return;
        // Skip the re-render entirely when nothing actually changed.
        if (fresh.at(-1)?.id !== lastIdRef.current || fresh.length !== messagesLengthRef.current) {
          lastIdRef.current = fresh.at(-1)?.id;
          setMessages(fresh);
        }
      } catch {
        // Transient network/auth blip — the next tick retries on its own.
      }
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchMessages]);

  // ---- auto-scroll, but only if the reader was already near the bottom ----
  useEffect(() => {
    const el = listRef.current;
    if (!el || !nearBottomRef.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    return () => clearTimeout(toastTimerRef.current);
  }, []);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  }, []);

  function showToast(message: string) {
    setToast(message);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_MS);
  }

  const attemptSend = useCallback(
    async (content: string, tempId: string) => {
      let result: SendResult;
      try {
        result = await sendAction(content);
      } catch {
        // Genuinely unexpected failure (offline, dropped connection mid-flight).
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
    },
    [sendAction],
  );

  function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || sendingRef.current) return;

    sendingRef.current = true;
    // Sending is always "my" action — reveal it even if the reader had
    // scrolled up to read history.
    nearBottomRef.current = true;

    const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic: OptimisticMessage = {
      id: tempId,
      tempId,
      authorId: viewerId,
      content: trimmed,
      createdAt: new Date(),
      author: { id: viewerId, name: viewerName ?? "You", nickname: null, image: viewerImage ?? null },
      status: "sending",
    };
    setPending((prev) => [...prev, optimistic]);

    void attemptSend(trimmed, tempId).finally(() => {
      sendingRef.current = false;
    });
  }

  function retry(m: OptimisticMessage) {
    setPending((prev) => prev.map((p) => (p.tempId === m.tempId ? { ...p, status: "sending" } : p)));
    void attemptSend(m.content, m.tempId);
  }

  function dismissToast() {
    setToast(null);
  }

  return {
    messages,
    pending,
    toast,
    listRef,
    handleScroll,
    sendMessage,
    retry,
    dismissToast,
  };
}

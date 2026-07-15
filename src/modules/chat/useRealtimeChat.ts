"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ChatMessage, SendResult } from "./types";

const NEAR_BOTTOM_PX = 80;
const TOAST_MS = 4000;

export type OptimisticMessage = ChatMessage & {
  tempId: string;
  status: "sending" | "failed";
};

/**
 * Shared realtime chat engine for both Group Chat and Direct Messages.
 *
 * Realtime is Supabase Broadcast, fed by a Postgres trigger on insert (see
 * scripts/setup-realtime-broadcast.mjs) — not Postgres Changes, so no RLS
 * policy is needed on the message tables themselves for this to work.
 * Broadcast is fire-and-forget (no replay), so every (re)subscribe also
 * triggers a refetch to catch up on anything sent during a disconnect.
 *
 * Sending is optimistic: the bubble and cleared input happen before the
 * network call resolves; the server action's response (or a caught error)
 * reconciles it. The channel is only used to receive *other* people's
 * messages — the sender's own message is reconciled directly, never
 * waiting on its own broadcast to come back around.
 */
export function useRealtimeChat({
  channelTopic,
  viewerId,
  viewerName,
  viewerImage,
  initialMessages,
  sendAction,
  refetchMessages,
}: {
  channelTopic: string;
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
  // Always current — the broadcast subscription callback closes over the
  // module once on mount, so it can't read fresh React state directly.
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // ---- realtime subscription ----
  useEffect(() => {
    let supabase;
    try {
      supabase = getSupabaseBrowserClient();
    } catch (e) {
      // Realtime env vars not configured — chat still works (send/receive
      // on page load), it just won't get live pushes until they're set.
      // eslint-disable-next-line no-console
      console.error(e);
      return;
    }

    const channel = supabase.channel(channelTopic, {
      config: { broadcast: { self: false } },
    });

    channel.on("broadcast", { event: "new_message" }, ({ payload }) => {
      const row = payload as {
        id: string;
        authorId: string;
        content: string;
        createdAt: string;
        author: ChatMessage["author"];
      };
      const incoming: ChatMessage = {
        id: row.id,
        authorId: row.authorId,
        content: row.content,
        createdAt: new Date(row.createdAt),
        author: row.author,
      };
      setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        // Catch up on anything sent while we were disconnected/mounting —
        // broadcast has no history/replay, so this is the only way back.
        void refetchMessages().then((fresh) => {
          setMessages((prev) => {
            const known = new Set(prev.map((m) => m.id));
            const merged = [...prev];
            for (const m of fresh) {
              if (!known.has(m.id)) merged.push(m);
            }
            // Prefer the server's order wholesale once we have it — cheaper
            // and safer than trying to interleave two partially-known lists.
            return fresh.length >= prev.length ? fresh : merged;
          });
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelTopic]);

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

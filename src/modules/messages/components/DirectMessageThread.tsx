"use client";

import { ChatThread } from "@/modules/chat/ChatThread";
import { sendDirectMessage, getConversationMessages } from "../actions";
import type { DirectChatMessage } from "../queries";

/**
 * Thin client wrapper, same reason GroupChat has one: Server Actions get
 * bound to their arguments (conversationId) here, inside a Client
 * Component, rather than passed as ad-hoc closures across the Server-to-
 * Client boundary from the page — keeps the binding pattern identical to
 * Group Chat's.
 */
export function DirectMessageThread({
  conversationId,
  viewerId,
  viewerName,
  viewerImage,
  initialMessages,
  otherName,
}: {
  conversationId: string;
  viewerId: string;
  viewerName?: string | null;
  viewerImage?: string | null;
  initialMessages: DirectChatMessage[];
  otherName: string;
}) {
  const firstName = otherName.split(" ")[0];
  return (
    <ChatThread
      channelTopic={`dm:${conversationId}`}
      viewerId={viewerId}
      viewerName={viewerName}
      viewerImage={viewerImage}
      initialMessages={initialMessages}
      sendAction={(content) => sendDirectMessage(conversationId, content)}
      refetchMessages={() => getConversationMessages(conversationId)}
      emptyLabel={`Say hi to ${firstName}.`}
      placeholder={`Message ${firstName}…`}
    />
  );
}

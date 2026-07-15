"use client";

import { Card, CardHeader } from "@/ui/components/Card";
import { ChatThread } from "@/modules/chat/ChatThread";
import { getGroupMessages, sendGroupMessage, type GroupChatMessage } from "../chat";

/** Thin wrapper: all polling/optimistic-send/scroll logic lives in ChatThread. */
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
  return (
    <Card className="relative">
      <CardHeader className="font-semibold">Chat</CardHeader>
      <ChatThread
        viewerId={viewerId}
        viewerName={viewerName}
        viewerImage={viewerImage}
        initialMessages={initialMessages}
        sendAction={(content) => sendGroupMessage(groupId, content)}
        refetchMessages={() => getGroupMessages(groupId)}
        emptyLabel="No messages yet — say hi."
        placeholder="Message your team…"
      />
    </Card>
  );
}

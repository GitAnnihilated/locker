"use client";

import { Card, CardHeader } from "@/ui/components/Card";
import { ChatThread } from "@/modules/chat/ChatThread";
import { getClassMessages, sendClassMessage, type ClassChatMessage } from "../chat";

/** Thin wrapper, identical in shape to GroupChat — all logic lives in the shared ChatThread. */
export function CourseChat({
  classId,
  viewerId,
  viewerName,
  viewerImage,
  initialMessages,
}: {
  classId: string;
  viewerId: string;
  viewerName?: string | null;
  viewerImage?: string | null;
  initialMessages: ClassChatMessage[];
}) {
  return (
    <Card className="relative">
      <CardHeader className="font-semibold">Discussion</CardHeader>
      <ChatThread
        viewerId={viewerId}
        viewerName={viewerName}
        viewerImage={viewerImage}
        initialMessages={initialMessages}
        sendAction={(content) => sendClassMessage(classId, content)}
        refetchMessages={() => getClassMessages(classId)}
        emptyLabel="No questions yet — be the first to ask."
        placeholder="Ask something about this course…"
      />
    </Card>
  );
}

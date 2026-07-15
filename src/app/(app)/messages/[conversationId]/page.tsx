import Link from "next/link";
import { requireUser } from "@/core/auth/session";
import { getConversationForViewer, getConversationMessages } from "@/modules/messages/queries";
import { markConversationRead } from "@/modules/messages/actions";
import { DirectMessageThread } from "@/modules/messages/components/DirectMessageThread";
import { Avatar } from "@/ui/components/Avatar";
import { Card } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const user = await requireUser();

  const conversation = await getConversationForViewer(conversationId, user.id);
  if (!conversation) {
    return <EmptyState icon="🔍" title="Conversation not found" />;
  }

  const [messages] = await Promise.all([
    getConversationMessages(conversationId, user.id),
    markConversationRead(conversationId),
  ]);

  const name = conversation.other.nickname || conversation.other.name || "Member";

  return (
    <div className="space-y-4">
      <Link href="/messages" className="text-sm font-medium text-subtle hover:text-text">
        ← Messages
      </Link>

      <Card className="relative">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Avatar name={name} image={conversation.other.image} size={32} />
          <p className="font-semibold">{name}</p>
        </div>

        <DirectMessageThread
          conversationId={conversationId}
          viewerId={user.id}
          viewerName={user.name}
          viewerImage={user.image}
          initialMessages={messages ?? []}
          otherName={name}
        />
      </Card>
    </div>
  );
}

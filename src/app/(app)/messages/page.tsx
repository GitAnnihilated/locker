import Link from "next/link";
import { requireUser } from "@/core/auth/session";
import { getConversations } from "@/modules/messages/queries";
import { NewMessageDialog } from "@/modules/messages/components/NewMessageDialog";
import { Avatar } from "@/ui/components/Avatar";
import { EmptyState } from "@/ui/components/EmptyState";
import { relativeTime } from "@/lib/format";

export default async function MessagesPage() {
  const user = await requireUser();
  const conversations = await getConversations(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Messages</h1>
        <NewMessageDialog />
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon="💬"
          title="No conversations yet"
          description="Start a direct message with anyone in your school."
          action={<NewMessageDialog />}
        />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {conversations.map((c) => {
            const name = c.other.nickname || c.other.name || "Member";
            const preview = c.lastMessage
              ? c.lastMessage.senderId === user.id
                ? `You: ${c.lastMessage.content}`
                : c.lastMessage.content
              : "No messages yet";
            return (
              <Link
                key={c.id}
                href={`/messages/${c.id}`}
                className="flex items-center gap-3 px-4 py-3 transition duration ease hover:bg-muted"
              >
                <Avatar name={name} image={c.other.image} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={c.unread ? "truncate font-semibold" : "truncate font-medium"}>{name}</p>
                    {c.lastMessage && (
                      <span className="shrink-0 text-2xs text-faint">{relativeTime(c.lastMessage.createdAt)}</span>
                    )}
                  </div>
                  <p className={c.unread ? "truncate text-sm text-text" : "truncate text-sm text-subtle"}>
                    {preview}
                  </p>
                </div>
                {c.unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// One-time setup: Postgres triggers that broadcast new chat rows via
// Supabase Realtime's "Broadcast from Database" feature (realtime.send).
// This runs entirely inside Postgres — the app's server actions never open
// their own realtime connection just to publish a message, which would add
// a websocket-handshake's worth of latency to every send in a serverless
// function.
//
// The payload is enriched with the sender's display info (name/nickname/
// image) via a subquery, since the trigger's NEW record is just the raw
// inserted row — without this, other clients would receive a message with
// no author name/avatar to render.
//
// Safe to re-run: every statement is CREATE OR REPLACE / DROP IF EXISTS.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const statements = [
  // --- Group chat ---
  `create or replace function public.broadcast_group_message()
   returns trigger
   security definer
   language plpgsql
   as $$
   declare
     author jsonb;
   begin
     select jsonb_build_object('id', u.id, 'name', u.name, 'nickname', u.nickname, 'image', u.image)
       into author
       from "User" u where u.id = new."authorId";

     perform realtime.send(
       jsonb_build_object(
         'id', new.id,
         'groupId', new."groupId",
         'authorId', new."authorId",
         'content', new.content,
         'createdAt', new."createdAt",
         'author', author
       ),
       'new_message',
       'group-chat:' || new."groupId"::text,
       false
     );
     return new;
   end;
   $$;`,
  `drop trigger if exists on_group_message_insert on "GroupMessage";`,
  `create trigger on_group_message_insert
   after insert on "GroupMessage"
   for each row execute function public.broadcast_group_message();`,

  // --- Direct messages ---
  `create or replace function public.broadcast_direct_message()
   returns trigger
   security definer
   language plpgsql
   as $$
   declare
     author jsonb;
   begin
     select jsonb_build_object('id', u.id, 'name', u.name, 'nickname', u.nickname, 'image', u.image)
       into author
       from "User" u where u.id = new."senderId";

     perform realtime.send(
       jsonb_build_object(
         'id', new.id,
         'conversationId', new."conversationId",
         'authorId', new."senderId",
         'content', new.content,
         'createdAt', new."createdAt",
         'author', author
       ),
       'new_message',
       'dm:' || new."conversationId"::text,
       false
     );
     return new;
   end;
   $$;`,
  `drop trigger if exists on_direct_message_insert on "DirectMessage";`,
  `create trigger on_direct_message_insert
   after insert on "DirectMessage"
   for each row execute function public.broadcast_direct_message();`,
];

for (const [i, sql] of statements.entries()) {
  try {
    await db.$executeRawUnsafe(sql);
    console.log(`[${i + 1}/${statements.length}] ok`);
  } catch (e) {
    console.error(`[${i + 1}/${statements.length}] FAILED:`, e.message);
    process.exitCode = 1;
  }
}

await db.$disconnect();

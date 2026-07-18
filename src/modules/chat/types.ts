export type ChatAuthor = {
  id: string;
  name: string | null;
  nickname: string | null;
  image: string | null;
  /** Equipped cosmetic perk values, already reduced server-side — see core/rewards/cosmetics.ts */
  nameColor?: string;
  avatarFrame?: string;
  chatBubble?: string;
};

/** Shared shape both Group Chat and Direct Messages normalize into. */
export type ChatMessage = {
  id: string;
  content: string;
  createdAt: Date;
  authorId: string;
  author: ChatAuthor;
};

export type SendResult = { message: ChatMessage } | { error: string };

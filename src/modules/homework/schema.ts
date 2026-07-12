import { z } from "zod";

/** One Zod schema validates both the client form and the server action. */
export const createHomeworkSchema = z.object({
  title: z.string().min(2, "Give it a title").max(140),
  description: z.string().max(2000).optional(),
  subject: z.string().max(60).optional(),
  dueAt: z.string().optional(), // ISO date from <input type="date">
});

export type CreateHomeworkInput = z.infer<typeof createHomeworkSchema>;

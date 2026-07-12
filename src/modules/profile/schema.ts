import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Enter your full name").max(120),
  nickname: z.string().max(60).optional(),
  bio: z.string().max(500).optional(),
  // No object storage wired yet — this is a plain image URL for now.
  image: z.string().url().optional().or(z.literal("")),
});

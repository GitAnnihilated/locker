import { z } from "zod";
import { AchievementCategory, AchievementLevel, Visibility } from "@prisma/client";

export const achievementSchema = z.object({
  title: z.string().min(2, "Give it a title").max(140),
  category: z.nativeEnum(AchievementCategory),
  description: z.string().max(2000).optional(),
  level: z.nativeEnum(AchievementLevel),
  achievedOn: z.string().min(1, "Add a date"), // ISO date from <input type="date">
  certificateUrl: z.string().url().optional().or(z.literal("")),
  photoUrl: z.string().url().optional().or(z.literal("")),
  link: z.string().url().optional().or(z.literal("")),
  visibility: z.nativeEnum(Visibility),
});

export type AchievementInput = z.infer<typeof achievementSchema>;

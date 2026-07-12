import { z } from "zod";
import { ResourceType, TaskStatus } from "@prisma/client";

export const createGroupSchema = z.object({
  name: z.string().min(2, "Give the project a name").max(140),
  subject: z.string().max(60).optional(),
  description: z.string().max(2000).optional(),
  teacherName: z.string().max(120).optional(),
  dueAt: z.string().optional(),
});

export const projectDetailsSchema = createGroupSchema;

export const joinRequestSchema = z.object({
  message: z.string().max(500).optional(),
});

export const taskSchema = z.object({
  title: z.string().min(2, "Give the task a title").max(140),
  description: z.string().max(1000).optional(),
  assigneeId: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  dueAt: z.string().optional(),
});

export const resourceSchema = z.object({
  title: z.string().min(2, "Give it a title").max(140),
  type: z.nativeEnum(ResourceType),
  url: z.string().url("Enter a valid link"),
  description: z.string().max(500).optional(),
});

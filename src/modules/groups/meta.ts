import type { GroupRole, ProjectStatus, ResourceType, TaskStatus } from "@prisma/client";

export const STATUS_META: Record<ProjectStatus, { label: string; tone: "neutral" | "accent" | "success" | "warning" }> = {
  UPCOMING: { label: "Upcoming", tone: "neutral" },
  IN_PROGRESS: { label: "In Progress", tone: "accent" },
  COMPLETED: { label: "Completed", tone: "success" },
  ARCHIVED: { label: "Archived", tone: "neutral" },
};

export const ROLE_META: Record<GroupRole, { label: string }> = {
  LEADER: { label: "Leader" },
  CO_LEADER: { label: "Co-Leader" },
  MEMBER: { label: "Member" },
};

export const TASK_STATUS_META: Record<TaskStatus, { label: string }> = {
  NOT_STARTED: { label: "Not Started" },
  IN_PROGRESS: { label: "In Progress" },
  COMPLETED: { label: "Completed" },
};

export const RESOURCE_TYPE_META: Record<ResourceType, { label: string; icon: string }> = {
  NOTE: { label: "Note", icon: "📝" },
  PDF: { label: "PDF", icon: "📄" },
  DOCUMENT: { label: "Document", icon: "📃" },
  PRESENTATION: { label: "Presentation", icon: "📊" },
  IMAGE: { label: "Image", icon: "🖼️" },
  LINK: { label: "Link", icon: "🔗" },
  GOOGLE_DOC: { label: "Google Doc", icon: "📘" },
  GOOGLE_SLIDES: { label: "Google Slides", icon: "📙" },
  GOOGLE_DRIVE: { label: "Google Drive folder", icon: "📁" },
  OTHER: { label: "Other", icon: "📎" },
};

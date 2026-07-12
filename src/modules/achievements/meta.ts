import type { AchievementCategory, AchievementLevel, Visibility } from "@prisma/client";

export const CATEGORY_META: Record<AchievementCategory, { label: string; icon: string }> = {
  SPORTS: { label: "Sports", icon: "🏆" },
  ACADEMICS: { label: "Academics", icon: "📚" },
  CODING: { label: "Coding", icon: "💻" },
  ART: { label: "Art", icon: "🎨" },
  MUSIC: { label: "Music", icon: "🎵" },
  DRAMA: { label: "Drama", icon: "🎭" },
  DEBATE: { label: "Debate", icon: "🗣" },
  MUN: { label: "MUN", icon: "🌍" },
  VOLUNTEERING: { label: "Volunteering", icon: "❤️" },
  CERTIFICATION: { label: "Certification", icon: "📜" },
  READING: { label: "Reading", icon: "📖" },
  SCIENCE: { label: "Science", icon: "🧪" },
  PHOTOGRAPHY: { label: "Photography", icon: "📸" },
  OTHER: { label: "Other", icon: "⭐" },
};

// Ordered low -> high, doubles as sort weight for "most impressive first".
export const LEVEL_META: Record<AchievementLevel, { label: string; weight: number }> = {
  SCHOOL: { label: "School", weight: 1 },
  INTER_SCHOOL: { label: "Inter-School", weight: 2 },
  DISTRICT: { label: "District", weight: 3 },
  STATE: { label: "State", weight: 4 },
  NATIONAL: { label: "National", weight: 5 },
  INTERNATIONAL: { label: "International", weight: 6 },
};

export const VISIBILITY_META: Record<Visibility, { label: string; description: string }> = {
  PUBLIC: { label: "Public", description: "Visible to anyone with your profile link" },
  CLASS_ONLY: { label: "Classmates only", description: "Visible only to your classmates" },
  PRIVATE: { label: "Private", description: "Visible only to you" },
};

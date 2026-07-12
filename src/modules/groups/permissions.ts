import type { GroupRole } from "@prisma/client";

/**
 * Pure predicates over a member's role — mirrors core/permissions/rules.ts's
 * shape, kept module-local because group governance is entirely internal to
 * a project (unlike School/Class roles, which are cross-cutting identity).
 */

export function isLeader(role: GroupRole | null | undefined): boolean {
  return role === "LEADER";
}

export function isCoLeaderOrAbove(role: GroupRole | null | undefined): boolean {
  return role === "LEADER" || role === "CO_LEADER";
}

/** Invite members, accept/reject requests, manage tasks, edit project details. */
export function canManageProject(role: GroupRole | null | undefined): boolean {
  return isCoLeaderOrAbove(role);
}

/** Remove members, assign co-leaders, transfer ownership, archive, start deletion votes. */
export function canGovernProject(role: GroupRole | null | undefined): boolean {
  return isLeader(role);
}

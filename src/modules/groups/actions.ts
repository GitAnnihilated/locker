"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { getActiveMembership } from "@/core/membership/queries";
import { notifyUsers } from "@/core/notifications/create";
import { handleActionError } from "@/lib/actionError";
import { awardPoints } from "@/core/rewards/engine";
import { canGovernProject, canManageProject } from "./permissions";
import {
  createGroupSchema,
  joinRequestSchema,
  projectDetailsSchema,
  resourceSchema,
  taskSchema,
} from "./schema";

// ---------------------------------------------------------------------------
// internal helpers
// ---------------------------------------------------------------------------

async function logActivity(
  groupId: string,
  actorId: string,
  type: string,
  message: string,
  metadata?: object,
) {
  await db.groupActivity.create({ data: { groupId, actorId, type, message, metadata } });
}

/**
 * Guard helper — throws on failure, like core/permissions/guards.ts. Used
 * both internally by the exported actions below (whose top-level try/catch
 * converts the throw into a `{ error }` return) and externally by
 * modules/groups/chat.ts, which is not a user-facing form action.
 */
export async function requireMembership(groupId: string, userId: string) {
  const membership = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) throw new Error("You're not a member of this project");
  return membership;
}

async function requireManager(groupId: string, userId: string) {
  const membership = await requireMembership(groupId, userId);
  if (!canManageProject(membership.role)) {
    throw new Error("Only the Leader or a Co-Leader can do that");
  }
  return membership;
}

async function requireLeader(groupId: string, userId: string) {
  const membership = await requireMembership(groupId, userId);
  if (!canGovernProject(membership.role)) {
    throw new Error("Only the Leader can do that");
  }
  return membership;
}

async function getManagers(groupId: string) {
  const managers = await db.groupMember.findMany({
    where: { groupId, role: { in: ["LEADER", "CO_LEADER"] } },
    select: { userId: true },
  });
  return managers.map((m) => m.userId);
}

async function getAllMemberIds(groupId: string, excludeUserId?: string) {
  const members = await db.groupMember.findMany({
    where: { groupId, ...(excludeUserId ? { userId: { not: excludeUserId } } : {}) },
    select: { userId: true },
  });
  return members.map((m) => m.userId);
}

function displayName(user: { name: string | null; nickname: string | null }) {
  return user.nickname || user.name || "Someone";
}

// ---------------------------------------------------------------------------
// creation & membership
// ---------------------------------------------------------------------------

/** Creator becomes Leader immediately — there is exactly one Leader at a time. */
export async function createGroup(formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const membership = await getActiveMembership(user.id);
    if (!membership) throw new Error("Join a class first");

    const parsed = createGroupSchema.safeParse({
      name: formData.get("name"),
      subject: formData.get("subject") || undefined,
      description: formData.get("description") || undefined,
      teacherName: formData.get("teacherName") || undefined,
      dueAt: formData.get("dueAt") || undefined,
    });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid project");

    const group = await db.group.create({
      data: {
        classId: membership.classId,
        name: parsed.data.name,
        subject: parsed.data.subject,
        description: parsed.data.description,
        teacherName: parsed.data.teacherName,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
        members: { create: { userId: user.id, role: "LEADER" } },
      },
    });

    await logActivity(group.id, user.id, "created", `${user.name ?? "Someone"} created the project`);
    await awardPoints(user.id, "group_created", group.id);

    revalidatePath("/groups");
    redirect(`/groups/${group.id}`);
  } catch (e) {
    return handleActionError(e);
  }
}

/** Joining is never automatic — this only files a request for the Leader/Co-Leader to decide on. */
export async function requestToJoin(groupId: string, formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();

    const existingMembership = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
    });
    if (existingMembership) throw new Error("You're already a member");

    const existingRequest = await db.groupJoinRequest.findFirst({
      where: { groupId, userId: user.id, status: "PENDING" },
    });
    if (existingRequest) throw new Error("You already have a pending request");

    const parsed = joinRequestSchema.safeParse({ message: formData.get("message") || undefined });
    if (!parsed.success) throw new Error("Invalid request");

    await db.groupJoinRequest.create({
      data: { groupId, userId: user.id, message: parsed.data.message },
    });

    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { name: true, nickname: true } });
    await logActivity(
      groupId,
      user.id,
      "join_requested",
      `${dbUser ? displayName(dbUser) : "Someone"} requested to join`,
    );

    const managers = await getManagers(groupId);
    await notifyUsers(managers, {
      type: "group_join_request",
      message: `${dbUser ? displayName(dbUser) : "Someone"} wants to join your project`,
      link: `/groups/${groupId}`,
    });

    revalidatePath(`/groups/${groupId}`);
  } catch (e) {
    return handleActionError(e);
  }
}

export async function acceptJoinRequest(requestId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();

    const request = await db.groupJoinRequest.findUnique({ where: { id: requestId } });
    if (!request || request.status !== "PENDING") throw new Error("Request no longer pending");
    await requireManager(request.groupId, user.id);

    await db.$transaction([
      db.groupJoinRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED", decidedAt: new Date(), decidedById: user.id },
      }),
      db.groupMember.create({ data: { groupId: request.groupId, userId: request.userId, role: "MEMBER" } }),
    ]);
    await awardPoints(request.userId, "group_joined", request.groupId);

    const requester = await db.user.findUnique({ where: { id: request.userId }, select: { name: true, nickname: true } });
    await logActivity(
      request.groupId,
      user.id,
      "member_joined",
      `${requester ? displayName(requester) : "A student"} joined`,
    );
    await notifyUsers([request.userId], {
      type: "group_request_accepted",
      message: "Your request to join a project was accepted",
      link: `/groups/${request.groupId}`,
    });

    revalidatePath(`/groups/${request.groupId}`);
  } catch (e) {
    return handleActionError(e);
  }
}

export async function rejectJoinRequest(requestId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();

    const request = await db.groupJoinRequest.findUnique({ where: { id: requestId } });
    if (!request || request.status !== "PENDING") throw new Error("Request no longer pending");
    await requireManager(request.groupId, user.id);

    await db.groupJoinRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED", decidedAt: new Date(), decidedById: user.id },
    });

    await notifyUsers([request.userId], {
      type: "group_request_rejected",
      message: "Your request to join a project wasn't accepted",
    });

    revalidatePath(`/groups/${request.groupId}`);
  } catch (e) {
    return handleActionError(e);
  }
}

/** Leader only. Removed members immediately lose access — enforced by the membership check on every read. */
export async function removeMember(groupId: string, targetUserId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const leader = await requireLeader(groupId, user.id);
    if (targetUserId === leader.userId) throw new Error("Transfer leadership before leaving");

    await db.groupMember.deleteMany({ where: { groupId, userId: targetUserId } });

    const target = await db.user.findUnique({ where: { id: targetUserId }, select: { name: true, nickname: true } });
    await logActivity(groupId, user.id, "member_removed", `${target ? displayName(target) : "A member"} was removed`);
    await notifyUsers([targetUserId], {
      type: "group_removed",
      message: "You were removed from a project",
    });

    revalidatePath(`/groups/${groupId}`);
  } catch (e) {
    return handleActionError(e);
  }
}

/**
 * Any member can leave. If the leaver is the Leader, leadership auto-succeeds
 * to whoever's been on the project longest (earliest joinedAt among the
 * rest), so a project is never left leaderless. If the Leader is the only
 * member, they must archive instead — there's no one to hand off to.
 */
export async function leaveGroup(groupId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const membership = await requireMembership(groupId, user.id);

    if (membership.role !== "LEADER") {
      await db.groupMember.delete({ where: { id: membership.id } });
      const leaver = await db.user.findUnique({ where: { id: user.id }, select: { name: true, nickname: true } });
      await logActivity(groupId, user.id, "member_left", `${leaver ? displayName(leaver) : "A member"} left the project`);
      revalidatePath(`/groups/${groupId}`);
      return;
    }

    const successor = await db.groupMember.findFirst({
      where: { groupId, userId: { not: user.id } },
      orderBy: { joinedAt: "asc" },
    });

    if (!successor) {
      throw new Error("You're the only member left — archive the project instead of leaving it.");
    }

    await db.$transaction([
      db.groupMember.update({ where: { id: successor.id }, data: { role: "LEADER" } }),
      db.groupMember.delete({ where: { id: membership.id } }),
    ]);

    const [leaver, newLeader] = await Promise.all([
      db.user.findUnique({ where: { id: user.id }, select: { name: true, nickname: true } }),
      db.user.findUnique({ where: { id: successor.userId }, select: { name: true, nickname: true } }),
    ]);
    await logActivity(
      groupId,
      successor.userId,
      "leader_transferred",
      `${leaver ? displayName(leaver) : "The Leader"} left — leadership passed to ${newLeader ? displayName(newLeader) : "another member"}`,
    );
    await notifyUsers([successor.userId], {
      type: "group_leader_transferred",
      message: "You are now the Leader of a project",
      link: `/groups/${groupId}`,
    });

    revalidatePath(`/groups/${groupId}`);
  } catch (e) {
    return handleActionError(e);
  }
}

export async function promoteCoLeader(groupId: string, targetUserId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireLeader(groupId, user.id);

    await db.groupMember.updateMany({
      where: { groupId, userId: targetUserId, role: "MEMBER" },
      data: { role: "CO_LEADER" },
    });

    const target = await db.user.findUnique({ where: { id: targetUserId }, select: { name: true, nickname: true } });
    await logActivity(groupId, user.id, "role_changed", `${target ? displayName(target) : "A member"} became a Co-Leader`);
    await notifyUsers([targetUserId], {
      type: "group_role_changed",
      message: "You were made a Co-Leader",
      link: `/groups/${groupId}`,
    });

    revalidatePath(`/groups/${groupId}`);
  } catch (e) {
    return handleActionError(e);
  }
}

export async function demoteCoLeader(groupId: string, targetUserId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireLeader(groupId, user.id);

    await db.groupMember.updateMany({
      where: { groupId, userId: targetUserId, role: "CO_LEADER" },
      data: { role: "MEMBER" },
    });

    revalidatePath(`/groups/${groupId}`);
  } catch (e) {
    return handleActionError(e);
  }
}

/** Leader only — hands off leadership; the outgoing Leader becomes a Co-Leader, not a plain Member. */
export async function transferLeadership(groupId: string, targetUserId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const leader = await requireLeader(groupId, user.id);

    const target = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
    if (!target) throw new Error("New leader must already be a member");

    await db.$transaction([
      db.groupMember.update({ where: { id: leader.id }, data: { role: "CO_LEADER" } }),
      db.groupMember.update({ where: { id: target.id }, data: { role: "LEADER" } }),
    ]);

    const targetUser = await db.user.findUnique({ where: { id: targetUserId }, select: { name: true, nickname: true } });
    await logActivity(
      groupId,
      user.id,
      "leader_transferred",
      `Leadership was transferred to ${targetUser ? displayName(targetUser) : "another member"}`,
    );
    await notifyUsers([targetUserId], {
      type: "group_leader_transferred",
      message: "You are now the Leader of a project",
      link: `/groups/${groupId}`,
    });

    revalidatePath(`/groups/${groupId}`);
  } catch (e) {
    return handleActionError(e);
  }
}

// ---------------------------------------------------------------------------
// project details
// ---------------------------------------------------------------------------

export async function updateProjectDetails(groupId: string, formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireManager(groupId, user.id);

    const parsed = projectDetailsSchema.safeParse({
      name: formData.get("name"),
      subject: formData.get("subject") || undefined,
      description: formData.get("description") || undefined,
      teacherName: formData.get("teacherName") || undefined,
      dueAt: formData.get("dueAt") || undefined,
    });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid project details");

    const before = await db.group.findUnique({ where: { id: groupId }, select: { dueAt: true } });
    const newDueAt = parsed.data.dueAt ? new Date(parsed.data.dueAt) : null;
    const dueDateChanged = before?.dueAt?.getTime() !== newDueAt?.getTime();

    await db.group.update({
      where: { id: groupId },
      data: {
        name: parsed.data.name,
        subject: parsed.data.subject,
        description: parsed.data.description,
        teacherName: parsed.data.teacherName,
        dueAt: newDueAt,
      },
    });

    await logActivity(
      groupId,
      user.id,
      dueDateChanged ? "deadline_changed" : "details_updated",
      dueDateChanged ? "The deadline was changed" : "Project details were updated",
    );

    revalidatePath(`/groups/${groupId}`);
  } catch (e) {
    return handleActionError(e);
  }
}

export async function updateProjectStatus(
  groupId: string,
  status: "UPCOMING" | "IN_PROGRESS" | "COMPLETED",
): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireManager(groupId, user.id);

    await db.group.update({ where: { id: groupId }, data: { status } });
    revalidatePath(`/groups/${groupId}`);
  } catch (e) {
    return handleActionError(e);
  }
}

/** Leader only — hides the project without deleting it (see deletion votes for permanent removal). */
export async function archiveGroup(groupId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireLeader(groupId, user.id);

    await db.group.update({ where: { id: groupId }, data: { status: "ARCHIVED", archivedAt: new Date() } });
    await logActivity(groupId, user.id, "archived", "The project was archived");

    revalidatePath("/groups");
    revalidatePath(`/groups/${groupId}`);
  } catch (e) {
    return handleActionError(e);
  }
}

// ---------------------------------------------------------------------------
// tasks
// ---------------------------------------------------------------------------

export async function createTask(groupId: string, formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireManager(groupId, user.id);

    const parsed = taskSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      assigneeId: formData.get("assigneeId") || undefined,
      dueAt: formData.get("dueAt") || undefined,
    });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid task");

    if (parsed.data.assigneeId) {
      await requireMembership(groupId, parsed.data.assigneeId);
    }

    const task = await db.groupTask.create({
      data: {
        groupId,
        title: parsed.data.title,
        description: parsed.data.description,
        assigneeId: parsed.data.assigneeId || null,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
        createdById: user.id,
      },
    });

    if (task.assigneeId) {
      const assignee = await db.user.findUnique({ where: { id: task.assigneeId }, select: { name: true, nickname: true } });
      await logActivity(
        groupId,
        user.id,
        "task_assigned",
        `${task.title} was assigned to ${assignee ? displayName(assignee) : "a member"}`,
      );
      await notifyUsers([task.assigneeId], {
        type: "group_task_assigned",
        message: `You were assigned "${task.title}"`,
        link: `/groups/${groupId}`,
      });
    } else {
      await logActivity(groupId, user.id, "task_created", `${task.title} was added`);
    }

    revalidatePath(`/groups/${groupId}`);
  } catch (e) {
    return handleActionError(e);
  }
}

/** Any current member can update status — ticking off tasks is core participation. */
export async function updateTaskStatus(
  taskId: string,
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED",
): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const task = await db.groupTask.findUnique({ where: { id: taskId } });
    if (!task) throw new Error("Task not found");
    await requireMembership(task.groupId, user.id);

    await db.groupTask.update({
      where: { id: taskId },
      data: { status, completedAt: status === "COMPLETED" ? new Date() : null },
    });

    if (status === "COMPLETED") {
      await logActivity(task.groupId, user.id, "task_completed", `${task.title} was completed`);
    }

    revalidatePath(`/groups/${task.groupId}`);
  } catch (e) {
    return handleActionError(e);
  }
}

export async function deleteTask(taskId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const task = await db.groupTask.findUnique({ where: { id: taskId } });
    if (!task) return;
    await requireManager(task.groupId, user.id);

    await db.groupTask.delete({ where: { id: taskId } });
    revalidatePath(`/groups/${task.groupId}`);
  } catch (e) {
    return handleActionError(e);
  }
}

// ---------------------------------------------------------------------------
// resources
// ---------------------------------------------------------------------------

/** Any member can share a resource — resources aren't governance, they're contribution. */
export async function addResource(groupId: string, formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireMembership(groupId, user.id);

    const parsed = resourceSchema.safeParse({
      title: formData.get("title"),
      type: formData.get("type"),
      url: formData.get("url"),
      description: formData.get("description") || undefined,
    });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid resource");

    const resource = await db.groupResource.create({
      data: {
        groupId,
        title: parsed.data.title,
        type: parsed.data.type,
        url: parsed.data.url,
        description: parsed.data.description,
        uploaderId: user.id,
      },
    });

    await awardPoints(user.id, "resource_uploaded", resource.id);
    await logActivity(groupId, user.id, "resource_added", `${parsed.data.title} was shared`);

    revalidatePath(`/groups/${groupId}`);
  } catch (e) {
    return handleActionError(e);
  }
}

export async function removeResource(resourceId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const resource = await db.groupResource.findUnique({ where: { id: resourceId } });
    if (!resource) return;

    if (resource.uploaderId !== user.id) {
      await requireManager(resource.groupId, user.id);
    } else {
      await requireMembership(resource.groupId, user.id);
    }

    await db.groupResource.update({ where: { id: resourceId }, data: { deletedAt: new Date() } });
    revalidatePath(`/groups/${resource.groupId}`);
  } catch (e) {
    return handleActionError(e);
  }
}

// ---------------------------------------------------------------------------
// deletion votes
// ---------------------------------------------------------------------------

/** Leader only. Resolves once every CURRENT member has cast a ballot (see castDeletionVote). */
export async function startDeletionVote(groupId: string): Promise<{ error: string } | { voteId: string }> {
  try {
    const user = await requireUser();
    await requireLeader(groupId, user.id);

    const existing = await db.groupDeletionVote.findFirst({ where: { groupId, status: "OPEN" } });
    if (existing) throw new Error("A deletion vote is already open");

    const vote = await db.groupDeletionVote.create({
      data: { groupId, initiatedById: user.id },
    });

    await logActivity(groupId, user.id, "deletion_vote_started", "A deletion vote was started");

    const memberIds = await getAllMemberIds(groupId, user.id);
    await notifyUsers(memberIds, {
      type: "group_deletion_vote",
      message: "A teammate wants to delete a project — cast your vote",
      link: `/groups/${groupId}`,
    });

    revalidatePath(`/groups/${groupId}`);
    return { voteId: vote.id };
  } catch (e) {
    return handleActionError(e);
  }
}

/**
 * Returns the outcome so the calling component can show the exact result
 * message (e.g. the tie message below) immediately, before the open vote
 * disappears from the dashboard query on the next page load.
 */
export async function castDeletionVote(
  voteId: string,
  choice: "DELETE" | "KEEP",
): Promise<{ error: string } | { status: "OPEN" | "PASSED" | "FAILED" | "TIED"; message: string | null }> {
  try {
    const user = await requireUser();

    const vote = await db.groupDeletionVote.findUnique({ where: { id: voteId } });
    if (!vote || vote.status !== "OPEN") throw new Error("This vote has already ended");
    await requireMembership(vote.groupId, user.id);

    await db.groupDeletionBallot.upsert({
      where: { voteId_userId: { voteId, userId: user.id } },
      create: { voteId, userId: user.id, choice },
      update: { choice },
    });

    const outcome = await resolveDeletionVoteIfComplete(vote.groupId, voteId);

    revalidatePath(`/groups/${vote.groupId}`);
    return outcome;
  } catch (e) {
    return handleActionError(e);
  }
}

async function resolveDeletionVoteIfComplete(groupId: string, voteId: string) {
  const [memberCount, ballots, vote] = await Promise.all([
    db.groupMember.count({ where: { groupId } }),
    db.groupDeletionBallot.findMany({ where: { voteId } }),
    db.groupDeletionVote.findUniqueOrThrow({ where: { id: voteId } }),
  ]);

  if (ballots.length < memberCount) {
    return { status: "OPEN" as const, message: null };
  }

  const deleteVotes = ballots.filter((b) => b.choice === "DELETE").length;
  const keepVotes = ballots.length - deleteVotes;

  let status: "PASSED" | "FAILED" | "TIED";
  if (deleteVotes > memberCount / 2) status = "PASSED";
  else if (deleteVotes === keepVotes) status = "TIED";
  else status = "FAILED";

  await db.groupDeletionVote.update({
    where: { id: voteId },
    data: { status, resolvedAt: new Date() },
  });

  if (status === "PASSED") {
    await db.group.update({ where: { id: groupId }, data: { status: "ARCHIVED", archivedAt: new Date() } });
  }

  const message =
    status === "PASSED"
      ? "The vote passed — the project was archived"
      : status === "TIED"
        ? "The deletion vote ended in a tie. Please discuss with your teammates before starting another deletion vote."
        : "The deletion vote did not pass — the project stays";

  // actorId is a real FK to User — attribute the resolution entry to whoever
  // started the vote, since there's no "system" user row.
  await logActivity(groupId, vote.initiatedById, "deletion_vote_resolved", message);

  const memberIds = await getAllMemberIds(groupId);
  await notifyUsers(memberIds, { type: "group_deletion_vote_resolved", message, link: `/groups/${groupId}` });

  return { status, message };
}

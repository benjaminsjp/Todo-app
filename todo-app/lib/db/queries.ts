import 'server-only'
import { db } from '@/lib/db'
import { tasks, taskGroups, statuses, organizationMembers, invitations, comments, users, userNotifications } from '@/lib/db/schema'
import { eq, isNull, and, gt, inArray, count, isNotNull } from 'drizzle-orm'
import { normalizeTaskAssignees, TASK_WITH_ASSIGNEES } from '@/lib/taskAssignees'
import { canEditOrgContent } from '@/lib/orgPermissions'

async function attachCommentCounts<T extends { id: number }>(
  rows: T[],
): Promise<(T & { commentCount: number })[]> {
  if (rows.length === 0) return []

  const ids = rows.map((t) => t.id)
  const counts = await db
    .select({ taskId: comments.taskId, count: count() })
    .from(comments)
    .where(inArray(comments.taskId, ids))
    .groupBy(comments.taskId)

  const countByTaskId = new Map(counts.map((r) => [r.taskId, Number(r.count)]))

  return rows.map((row) => ({
    ...row,
    commentCount: countByTaskId.get(row.id) ?? 0,
  }))
}

export async function getTasksForUser(userId: string) {
  const rows = await db.query.tasks.findMany({
    where: and(eq(tasks.createdBy, userId), isNull(tasks.orgId)),
    with: TASK_WITH_ASSIGNEES,
    orderBy: (tasks, { asc }) => [asc(tasks.order)],
  })
  return attachCommentCounts(rows.map(normalizeTaskAssignees))
}

/** Up to `limit` open tasks with a deadline, soonest first (overdue included). */
export async function getUpcomingDeadlineTasksForUser(userId: string, limit = 5) {
  const memberships = await db.query.organizationMembers.findMany({
    where: eq(organizationMembers.userId, userId),
    columns: { orgId: true, role: true },
  })
  const orgIds = memberships.map((m) => m.orgId)
  const roleByOrgId = new Map(memberships.map((m) => [m.orgId, m.role]))

  const [personalRows, orgRows] = await Promise.all([
    db.query.tasks.findMany({
      where: and(
        eq(tasks.createdBy, userId),
        isNull(tasks.orgId),
        isNotNull(tasks.endAt),
      ),
      with: {
        ...TASK_WITH_ASSIGNEES,
        org: { columns: { slug: true, name: true } },
      },
    }),
    orgIds.length === 0
      ? Promise.resolve([])
      : db.query.tasks.findMany({
          where: and(inArray(tasks.orgId, orgIds), isNotNull(tasks.endAt)),
          with: {
            ...TASK_WITH_ASSIGNEES,
            org: { columns: { slug: true, name: true } },
          },
        }),
  ])

  const relevantOrgRows = orgRows
    .map((row) => normalizeTaskAssignees(row))
    .filter((task) => (task.assignees ?? []).some((user) => user.id === userId))

  const combined = [
    ...personalRows.map((row) => normalizeTaskAssignees(row)),
    ...relevantOrgRows,
  ].filter((task) => {
    if (!task.endAt) return false
    // Hide completed columns (default done order is 2).
    if (task.status?.order === 2) return false
    return true
  })

  combined.sort((a, b) => {
    const aPriority = a.deadlinePriority ? 1 : 0
    const bPriority = b.deadlinePriority ? 1 : 0
    if (aPriority !== bPriority) return bPriority - aPriority
    const aTime = new Date(a.endAt!).getTime()
    const bTime = new Date(b.endAt!).getTime()
    return aTime - bTime
  })

  // Return extra candidates so the client can still fill the widget after personal hides.
  const candidateLimit = Math.max(limit * 5, 25)

  return combined.slice(0, candidateLimit).map((task) => {
    const orgId = task.orgId ?? null
    const canEdit = orgId == null
      ? true
      : canEditOrgContent(roleByOrgId.get(orgId))

    return {
      id:      task.id,
      title:   task.title,
      slug:    task.slug,
      endAt:   task.endAt!,
      orgSlug: task.org?.slug ?? null,
      orgName: task.org?.name ?? null,
      canEdit,
      deadlinePriority: Boolean(task.deadlinePriority),
      status:  task.status
        ? { label: task.status.label, color: task.status.color, icon: task.status.icon }
        : null,
    }
  })
}

async function attachTaskCounts<T extends { id: number }>(
  groups: T[],
): Promise<(T & { taskCount: number })[]> {
  if (groups.length === 0) return []

  const groupIds = groups.map((g) => g.id)
  const counts = await db
    .select({ groupId: tasks.groupId, count: count() })
    .from(tasks)
    .where(inArray(tasks.groupId, groupIds))
    .groupBy(tasks.groupId)

  const countByGroupId = new Map(
    counts
      .filter((r) => r.groupId != null)
      .map((r) => [r.groupId as number, Number(r.count)]),
  )

  return groups.map((group) => ({
    ...group,
    taskCount: countByGroupId.get(group.id) ?? 0,
  }))
}

export async function getTaskGroupsForUser(userId: string) {
  const groups = await db.query.taskGroups.findMany({
    where: and(eq(taskGroups.createdBy, userId), isNull(taskGroups.orgId)),
  })
  return attachTaskCounts(groups)
}

export async function getTaskGroupsForOrg(orgId: number) {
  const groups = await db.query.taskGroups.findMany({
    where: eq(taskGroups.orgId, orgId),
  })
  return attachTaskCounts(groups)
}

export async function getTaskBySlug(slug: string, _userId: string) {
  const row = await db.query.tasks.findFirst({
    where: eq(tasks.slug, slug),
    with: {
      ...TASK_WITH_ASSIGNEES,
      comments: { with: { user: true } },
    },
  })
  return row ? normalizeTaskAssignees(row) : null
}

export async function getTaskGroupOptions(userId: string, orgId?: number | null) {
  const groups = await db.query.taskGroups.findMany({
    where: orgId
      ? eq(taskGroups.orgId, orgId)
      : and(eq(taskGroups.createdBy, userId), isNull(taskGroups.orgId)),
  })
  return groups.map((g) => ({
    value: String(g.id),
    label: g.title,
    color: g.color,
  }))
}

export async function getTasksForOrg(orgId: number) {
  const rows = await db.query.tasks.findMany({
    where: eq(tasks.orgId, orgId),
    with: TASK_WITH_ASSIGNEES,
    orderBy: (tasks, { asc }) => [asc(tasks.order)],
  })
  return attachCommentCounts(rows.map(normalizeTaskAssignees))
}


export async function getStatusesForUser(userId: string) {
  return db.query.statuses.findMany({
    where: eq(statuses.userId, userId),
    orderBy: (s, { asc }) => [asc(s.order)],
  })
}

export async function getStatusesForOrg(orgId: number) {
  return db.query.statuses.findMany({
    where: eq(statuses.orgId, orgId),
    orderBy: (s, { asc }) => [asc(s.order)],
  })
}

export async function getPersonalTasksForSidebar(userId: string) {
  const rows = await db.query.tasks.findMany({
    where: and(eq(tasks.createdBy, userId), isNull(tasks.orgId)),
    with: TASK_WITH_ASSIGNEES,
    orderBy: (tasks, { asc }) => [asc(tasks.order)],
  })
  return rows.map(normalizeTaskAssignees)
}

export async function getPersonalGroupsForSidebar(userId: string) {
  return db.query.taskGroups.findMany({
    where: and(eq(taskGroups.createdBy, userId), isNull(taskGroups.orgId)),
    with: { tasks: { with: { status: true } } },
  })
}

export async function getPendingInvitationsForEmail(email: string) {
  return db.query.invitations.findMany({
    where: and(
      eq(invitations.email, email.toLowerCase()),
      gt(invitations.expiresAt, new Date()),
    ),
    with: { org: true },
    orderBy: (inv, { desc }) => [desc(inv.createdAt)],
  })
}

export async function getUnreadNotificationsForUser(userId: string) {
  return db.query.userNotifications.findMany({
    where: and(
      eq(userNotifications.userId, userId),
      isNull(userNotifications.readAt),
    ),
    orderBy: (notification, { desc }) => [desc(notification.createdAt)],
  })
}

export async function getOrgListForUser(userId: string) {
  const memberships = await db.query.organizationMembers.findMany({
    where: eq(organizationMembers.userId, userId),
    with: { org: { columns: { id: true, name: true, slug: true } } },
  })

  return memberships.map((m) => ({
    id:   m.org.id,
    name: m.org.name,
    slug: m.org.slug,
    role: m.role,
  }))
}

export async function getOrgNavData(orgId: number) {
  const [orgTasks, orgGroups, orgStatuses] = await Promise.all([
    db.query.tasks.findMany({
      where: eq(tasks.orgId, orgId),
      with: TASK_WITH_ASSIGNEES,
      orderBy: (tasks, { asc }) => [asc(tasks.order)],
    }),
    db.query.taskGroups.findMany({
      where: eq(taskGroups.orgId, orgId),
      with: { tasks: { with: { status: true } } },
    }),
    getStatusesForOrg(orgId),
  ])

  return { tasks: orgTasks.map(normalizeTaskAssignees), groups: orgGroups, statuses: orgStatuses }
}

export async function getPersonalAssigneeOptions(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, displayName: true, email: true, avatarUrl: true },
  })

  if (!user) return []

  return [
    {
      value: user.id,
      label: user.displayName ?? user.email,
      avatarUrl: user.avatarUrl,
    },
  ]
}

export async function getOrgAssigneeOptions(orgId: number) {
  const members = await db.query.organizationMembers.findMany({
    where: eq(organizationMembers.orgId, orgId),
    with: {
      user: {
        columns: { id: true, displayName: true, email: true, avatarUrl: true },
      },
    },
  })

  return members
    .filter((member) => member.user)
    .map((member) => ({
      value: member.user!.id,
      label: member.user!.displayName ?? member.user!.email,
      avatarUrl: member.user!.avatarUrl,
    }))
}

export async function getOrgPreviewsForUser(userId: string) {
  const memberships = await db.query.organizationMembers.findMany({
    where: eq(organizationMembers.userId, userId),
    columns: { role: true, orgId: true },
    with: { org: { columns: { id: true, name: true, slug: true } } },
  })

  if (memberships.length === 0) return []

  const orgIds = memberships.map((m) => m.orgId)

  const [taskCounts, memberCounts] = await Promise.all([
    db
      .select({ orgId: tasks.orgId, count: count() })
      .from(tasks)
      .where(inArray(tasks.orgId, orgIds))
      .groupBy(tasks.orgId),
    db
      .select({ orgId: organizationMembers.orgId, count: count() })
      .from(organizationMembers)
      .where(inArray(organizationMembers.orgId, orgIds))
      .groupBy(organizationMembers.orgId),
  ])

  const taskCountByOrg = new Map(taskCounts.map((r) => [r.orgId, Number(r.count)]))
  const memberCountByOrg = new Map(memberCounts.map((r) => [r.orgId, Number(r.count)]))

  return memberships.map((m) => ({
    id:          m.org.id,
    name:        m.org.name,
    slug:        m.org.slug,
    role:        m.role,
    taskCount:   taskCountByOrg.get(m.orgId) ?? 0,
    memberCount: memberCountByOrg.get(m.orgId) ?? 0,
  }))
}

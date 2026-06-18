import 'server-only'

import { db } from '@/lib/db'
import {
  comments,
  organizationMembers,
  organizations,
  statuses,
  taskGroups,
  tasks,
} from '@/lib/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { seedUserStatuses } from '@/lib/db/userStatuses'
import { DEMO_ORG_SLUG } from './config'
import { DEFAULT_STATUSES } from '@/lib/statusDefaults'

export async function resetDemoData(userId: string) {
  const personalTasks = await db.query.tasks.findMany({
    where: and(eq(tasks.createdBy, userId), isNull(tasks.orgId)),
    columns: { id: true },
  })

  for (const task of personalTasks) {
    await db.delete(comments).where(eq(comments.taskId, task.id))
  }
  await db.delete(tasks).where(and(eq(tasks.createdBy, userId), isNull(tasks.orgId)))
  await db.delete(taskGroups).where(and(eq(taskGroups.createdBy, userId), isNull(taskGroups.orgId)))

  const existingStatuses = await db.query.statuses.findFirst({
    where: eq(statuses.userId, userId),
  })
  if (!existingStatuses) {
    await seedUserStatuses(userId)
  }

  const userStatuses = await db.query.statuses.findMany({
    where: eq(statuses.userId, userId),
    orderBy: (s, { asc }) => [asc(s.order)],
  })
  const [todoStatus, inProgressStatus, doneStatus] = userStatuses

  const [personalGroup] = await db.insert(taskGroups).values({
    title: 'Kom i gang',
    color: 'bg-blue-500',
    createdBy: userId,
  }).returning()

  await db.insert(tasks).values([
    {
      title: 'Utforsk Kanban-tavlen',
      slug: 'explore-the-kanban-board',
      description: 'Dra oppgaver mellom kolonner for å oppdatere status.',
      statusId: todoStatus?.id,
      createdBy: userId,
      order: 0,
    },
    {
      title: 'Opprett din første oppgave',
      slug: 'create-your-first-task',
      description: 'Bruk sidepanelet for å legge til oppgaver og organisere dem i grupper.',
      statusId: inProgressStatus?.id,
      groupId: personalGroup.id,
      createdBy: userId,
      order: 1,
    },
    {
      title: 'Inviter teamet ditt',
      slug: 'invite-your-team',
      description: 'Opprett en organisasjon og samarbeid om delte prosjekter.',
      statusId: doneStatus?.id,
      createdBy: userId,
      order: 2,
    },
  ])

  let org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, DEMO_ORG_SLUG),
  })

  if (!org) {
    const [created] = await db.insert(organizations).values({
      name: 'Acme-teamet',
      slug: DEMO_ORG_SLUG,
    }).returning()
    org = created

    await db.insert(statuses).values(
      DEFAULT_STATUSES.map((s) => ({ ...s, orgId: org!.id }))
    )
  }

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.orgId, org.id),
      eq(organizationMembers.userId, userId),
    ),
  })
  if (!membership) {
    await db.insert(organizationMembers).values({
      orgId: org.id,
      userId,
      role: 'owner',
    })
  }

  const orgTasks = await db.query.tasks.findMany({
    where: eq(tasks.orgId, org.id),
    columns: { id: true },
  })
  for (const task of orgTasks) {
    await db.delete(comments).where(eq(comments.taskId, task.id))
  }
  await db.delete(tasks).where(eq(tasks.orgId, org.id))
  await db.delete(taskGroups).where(eq(taskGroups.orgId, org.id))

  let orgStatuses = await db.query.statuses.findMany({
    where: eq(statuses.orgId, org.id),
    orderBy: (s, { asc }) => [asc(s.order)],
  })
  if (orgStatuses.length === 0) {
    await db.insert(statuses).values(
      DEFAULT_STATUSES.map((s) => ({ ...s, orgId: org.id }))
    )
    orgStatuses = await db.query.statuses.findMany({
      where: eq(statuses.orgId, org.id),
      orderBy: (s, { asc }) => [asc(s.order)],
    })
  }

  const [orgTodo, orgInProgress, orgDone] = orgStatuses

  const [sprintGroup] = await db.insert(taskGroups).values({
    title: 'Sprint 12',
    color: 'bg-amber-500',
    orgId: org.id,
    createdBy: userId,
  }).returning()

  await db.insert(tasks).values([
    {
      title: 'Design landingsside',
      slug: 'design-landing-page',
      description: 'Fullfør hero-seksjonen og fremhev funksjonene.',
      statusId: orgDone?.id,
      orgId: org.id,
      groupId: sprintGroup.id,
      assigneeId: userId,
      createdBy: userId,
      order: 0,
    },
    {
      title: 'Implementer sanntidssynkronisering',
      slug: 'implement-realtime-sync',
      description: 'Koble opp SSE for live Kanban-oppdateringer på tvers av teammedlemmer.',
      statusId: orgInProgress?.id,
      orgId: org.id,
      groupId: sprintGroup.id,
      assigneeId: userId,
      createdBy: userId,
      order: 1,
    },
    {
      title: 'Skriv utgivelsesnotater',
      slug: 'write-release-notes',
      description: 'Oppsummer nye funksjoner for den kommende lanseringen.',
      statusId: orgTodo?.id,
      orgId: org.id,
      createdBy: userId,
      order: 2,
    },
  ])
}

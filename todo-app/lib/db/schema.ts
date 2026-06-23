// lib/db/schema.ts
import { pgTable, serial, text, timestamp, integer, boolean, pgEnum, uniqueIndex, jsonb } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id:          text('id').primaryKey(), 
  email:       text('email').notNull().unique(),
  displayName: text('display_name'),
  avatarUrl:   text('avatar_url'),
  createdAt:   timestamp('created_at').defaultNow(),
})

export const organizations = pgTable('organizations', {
  id:        serial('id').primaryKey(),
  name:      text('name').notNull(),
  slug:      text('slug').notNull().unique(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const orgRoleEnum = pgEnum('org_role', ['owner', 'admin', 'member', 'viewer'])

export const organizationMembers = pgTable('organization_members', {
  id:        serial('id').primaryKey(),
  orgId:     integer('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId:    text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role:      orgRoleEnum('role').notNull().default('member'),
  joinedAt:  timestamp('joined_at').defaultNow(),
})

export const invitations = pgTable('invitations', {
  id:        serial('id').primaryKey(),
  orgId:     integer('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  email:     text('email').notNull(),
  role:      orgRoleEnum('role').notNull().default('member'),
  token:     text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const statuses = pgTable('statuses', {
  id:     serial('id').primaryKey(),
  label:  text('label').notNull(),
  color:  text('color').notNull().default('gray'),
  icon:   text('icon'),
  order:  integer('order').notNull().default(0),
  orgId:  integer('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),           
})

export const taskGroups = pgTable('task_groups', {
  id:        serial('id').primaryKey(),
  title:     text('title').notNull(),
  color:     text('color').notNull().default('bg-gray-500'),
  orgId:     integer('org_id').references(() => organizations.id),
  createdBy: text('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
})

export const tasks = pgTable('tasks', {
  id:          serial('id').primaryKey(),
  title:       text('title').notNull(),
  description: text('description'),
  slug:        text('slug').notNull(),
  deadline:    text('deadline'),
  statusId:    integer('status_id').references(() => statuses.id),
  groupId:     integer('group_id').references(() => taskGroups.id),
  orgId:       integer('org_id').references(() => organizations.id),
  createdBy:   text('created_by').references(() => users.id),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
  order:       integer('order').notNull().default(0),
})

export const taskAssignees = pgTable('task_assignees', {
  id:     serial('id').primaryKey(),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (t) => ({
  taskUserUnique: uniqueIndex('task_assignees_task_id_user_id_unique').on(t.taskId, t.userId),
}))

export const comments = pgTable('comments', {
  id:        serial('id').primaryKey(),
  content:   text('content').notNull(),
  taskId:    integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId:    text('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const taskPresence = pgTable('task_presence', {
  id:         serial('id').primaryKey(),
  orgId:      integer('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  taskId:     integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId:     text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  mode:       text('mode').notNull().default('editing'),
  lastSeenAt: timestamp('last_seen_at').notNull().defaultNow(),
}, (t) => ({
  taskUserUnique: uniqueIndex('task_presence_task_id_user_id_unique').on(t.taskId, t.userId),
  orgTaskIdx:     uniqueIndex('task_presence_org_id_task_id_user_id_unique').on(t.orgId, t.taskId, t.userId),
}))

export const taskRevisions = pgTable('task_revisions', {
  id:        serial('id').primaryKey(),
  orgId:     integer('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  taskId:    integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId:    text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action:    text('action').notNull().default('update'),
  before:    jsonb('before').notNull(),
  after:     jsonb('after').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const notes = pgTable('notes', {
  id:        serial('id').primaryKey(),
  title:     text('title').notNull(),
  content:   text('content'),
  orgId:     integer('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const userNotifications = pgTable('user_notifications', {
  id:           serial('id').primaryKey(),
  userId:       text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:         text('type').notNull(),
  taskId:       integer('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  taskTitle:    text('task_title'),
  taskSlug:     text('task_slug'),
  orgSlug:      text('org_slug'),
  fromUserId:   text('from_user_id').references(() => users.id, { onDelete: 'set null' }),
  fromUserName: text('from_user_name'),
  readAt:       timestamp('read_at'),
  createdAt:    timestamp('created_at').defaultNow(),
})

import { relations } from 'drizzle-orm'

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members:    many(organizationMembers),
  taskGroups: many(taskGroups),
  tasks:      many(tasks),
  statuses:   many(statuses),
}))

export const taskGroupsRelations = relations(taskGroups, ({ one, many }) => ({
  org:   one(organizations, { fields: [taskGroups.orgId], references: [organizations.id] }),
  tasks: many(tasks),
}))

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  org:        one(organizations, { fields: [tasks.orgId],    references: [organizations.id] }),
  group:      one(taskGroups,    { fields: [tasks.groupId],  references: [taskGroups.id] }),
  status:     one(statuses,      { fields: [tasks.statusId], references: [statuses.id] }),
  assignees:  many(taskAssignees),
  comments:   many(comments),
}))

export const taskAssigneesRelations = relations(taskAssignees, ({ one }) => ({
  task: one(tasks, { fields: [taskAssignees.taskId], references: [tasks.id] }),
  user: one(users, { fields: [taskAssignees.userId], references: [users.id] }),
}))

export const commentsRelations = relations(comments, ({ one }) => ({
  task: one(tasks, { fields: [comments.taskId], references: [tasks.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}))

export const taskPresenceRelations = relations(taskPresence, ({ one }) => ({
  org:  one(organizations, { fields: [taskPresence.orgId], references: [organizations.id] }),
  task: one(tasks,         { fields: [taskPresence.taskId], references: [tasks.id] }),
  user: one(users,         { fields: [taskPresence.userId], references: [users.id] }),
}))

export const taskRevisionsRelations = relations(taskRevisions, ({ one }) => ({
  org:  one(organizations, { fields: [taskRevisions.orgId], references: [organizations.id] }),
  task: one(tasks,         { fields: [taskRevisions.taskId], references: [tasks.id] }),
  user: one(users,         { fields: [taskRevisions.userId], references: [users.id] }),
}))

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  org:  one(organizations, { fields: [organizationMembers.orgId],  references: [organizations.id] }),
  user: one(users,         { fields: [organizationMembers.userId], references: [users.id] }),
}))

export const invitationsRelations = relations(invitations, ({ one }) => ({
  org: one(organizations, { fields: [invitations.orgId], references: [organizations.id] }),
}))

export const userNotificationsRelations = relations(userNotifications, ({ one }) => ({
  user:     one(users, { fields: [userNotifications.userId], references: [users.id] }),
  task:     one(tasks, { fields: [userNotifications.taskId], references: [tasks.id] }),
  fromUser: one(users, { fields: [userNotifications.fromUserId], references: [users.id] }),
}))
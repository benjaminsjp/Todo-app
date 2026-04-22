// lib/db/schema.ts
import { pgTable, serial, text, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core'

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
  assigneeId:  text('assignee_id').references(() => users.id),
  createdBy:   text('created_by').references(() => users.id),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
  order:       integer('order').notNull().default(0),
})

export const comments = pgTable('comments', {
  id:        serial('id').primaryKey(),
  content:   text('content').notNull(),
  taskId:    integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId:    text('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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
  org:      one(organizations, { fields: [tasks.orgId],      references: [organizations.id] }),
  group:    one(taskGroups,    { fields: [tasks.groupId],    references: [taskGroups.id] }),
  status:   one(statuses,      { fields: [tasks.statusId],   references: [statuses.id] }),
  assignee: one(users,         { fields: [tasks.assigneeId], references: [users.id] }),
  comments: many(comments),
}))

export const commentsRelations = relations(comments, ({ one }) => ({
  task: one(tasks, { fields: [comments.taskId], references: [tasks.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}))

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  org:  one(organizations, { fields: [organizationMembers.orgId],  references: [organizations.id] }),
  user: one(users,         { fields: [organizationMembers.userId], references: [users.id] }),
}))

export const invitationsRelations = relations(invitations, ({ one }) => ({
  org: one(organizations, { fields: [invitations.orgId], references: [organizations.id] }),
}))
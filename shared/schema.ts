import { pgTable, serial, text, varchar, integer, timestamp, boolean, primaryKey, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  password: text('password'),
  fullName: varchar('full_name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  provider: varchar('provider', { length: 50 }),
  providerId: text('provider_id'),
  emailVerified: boolean('email_verified').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  role: varchar('role', { length: 50 }).default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  teamMemberships: many(teamMembers),
  sentFriendRequests: many(friendships, { relationName: 'sender' }),
  receivedFriendRequests: many(friendships, { relationName: 'receiver' }),
  payments: many(payments),
  emailVerifications: many(emailVerifications),
  tasks: many(tasks),
  timeEntries: many(timeEntries),
}));

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }),
  industry: varchar('industry', { length: 100 }),
  teamSize: varchar('team_size', { length: 50 }),
  timeline: varchar('timeline', { length: 100 }),
  budget: integer('budget'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  score: integer('score').default(0),
  riskLevel: varchar('risk_level', { length: 50 }),
  status: varchar('status', { length: 50 }).default('in_progress').notNull(),
  document: text('document'),
  analysisData: text('analysis_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  teamProjects: many(teamProjects),
  tasks: many(tasks),
}));

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  ownerId: integer('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const teamsRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, {
    fields: [teams.ownerId],
    references: [users.id],
  }),
  members: many(teamMembers),
  projects: many(teamProjects),
}));

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).default('member').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
  uniqueTeamUser: unique().on(table.teamId, table.userId),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const teamProjects = pgTable('team_projects', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at').defaultNow().notNull(),
}, (table) => ({
  uniqueTeamProject: unique().on(table.teamId, table.projectId),
}));

export const teamProjectsRelations = relations(teamProjects, ({ one }) => ({
  team: one(teams, {
    fields: [teamProjects.teamId],
    references: [teams.id],
  }),
  project: one(projects, {
    fields: [teamProjects.projectId],
    references: [projects.id],
  }),
}));

export const friendships = pgTable('friendships', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: integer('receiver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueFriendship: unique().on(table.senderId, table.receiverId),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  sender: one(users, {
    fields: [friendships.senderId],
    references: [users.id],
    relationName: 'sender',
  }),
  receiver: one(users, {
    fields: [friendships.receiverId],
    references: [users.id],
    relationName: 'receiver',
  }),
}));

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 3 }).default('usd').notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  stripePaymentId: text('stripe_payment_id'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

export const emailVerifications = pgTable('email_verifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  verified: boolean('verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const emailVerificationsRelations = relations(emailVerifications, ({ one }) => ({
  user: one(users, {
    fields: [emailVerifications.userId],
    references: [users.id],
  }),
}));

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  read: boolean('read').default(false).notNull(),
  actionUrl: text('action_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  assignee: varchar('assignee', { length: 100 }),
  dueDate: timestamp('due_date'),
  status: varchar('status', { length: 50 }).default('todo').notNull(),
  priority: varchar('priority', { length: 50 }).default('medium').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  timeEntries: many(timeEntries),
}));

export const timeEntries = pgTable('time_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  taskId: integer('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'set null' }),
  clockIn: timestamp('clock_in').notNull(),
  clockOut: timestamp('clock_out'),
  duration: integer('duration'), // in minutes
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [timeEntries.taskId],
    references: [tasks.id],
  }),
  project: one(projects, {
    fields: [timeEntries.projectId],
    references: [projects.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;
export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = typeof friendships.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type EmailVerification = typeof emailVerifications.$inferSelect;
export type InsertEmailVerification = typeof emailVerifications.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = typeof timeEntries.$inferInsert;

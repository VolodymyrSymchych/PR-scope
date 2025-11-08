import { eq, and, or, desc, isNull } from 'drizzle-orm';
import { db } from './db';
import {
  users,
  projects,
  teams,
  teamMembers,
  teamProjects,
  friendships,
  payments,
  emailVerifications,
  notifications,
  tasks,
  timeEntries,
  type User,
  type InsertUser,
  type Project,
  type InsertProject,
  type Team,
  type InsertTeam,
  type TeamMember,
  type InsertTeamMember,
  type Friendship,
  type InsertFriendship,
  type Payment,
  type InsertPayment,
  type EmailVerification,
  type InsertEmailVerification,
  type Notification,
  type InsertNotification,
  type Task,
  type InsertTask,
  type TimeEntry,
  type InsertTimeEntry,
} from '../shared/schema';

export class DatabaseStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Teams
  async createTeam(teamData: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values(teamData).returning();
    return team;
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async getUserTeams(userId: number): Promise<Team[]> {
    const teamMemberRecords = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));

    const teamIds = teamMemberRecords.map((tm) => tm.teamId);

    if (teamIds.length === 0) {
      return [];
    }

    return await db.select().from(teams).where(
      or(...teamIds.map((id) => eq(teams.id, id)))
    );
  }

  async addTeamMember(memberData: InsertTeamMember): Promise<TeamMember> {
    const [member] = await db.insert(teamMembers).values(memberData).returning();
    return member;
  }

  async removeTeamMember(teamId: number, userId: number): Promise<void> {
    await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  }

  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
  }

  // Friendships
  async sendFriendRequest(senderId: number, receiverId: number): Promise<Friendship> {
    const [friendship] = await db
      .insert(friendships)
      .values({
        senderId,
        receiverId,
        status: 'pending',
      })
      .returning();
    return friendship;
  }

  async acceptFriendRequest(id: number): Promise<Friendship | undefined> {
    const [friendship] = await db
      .update(friendships)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(friendships.id, id))
      .returning();
    return friendship;
  }

  async rejectFriendRequest(id: number): Promise<void> {
    await db.delete(friendships).where(eq(friendships.id, id));
  }

  async getFriends(userId: number): Promise<Friendship[]> {
    return await db
      .select()
      .from(friendships)
      .where(
        and(
          or(eq(friendships.senderId, userId), eq(friendships.receiverId, userId)),
          eq(friendships.status, 'accepted')
        )
      );
  }

  async getPendingFriendRequests(userId: number): Promise<Friendship[]> {
    return await db
      .select()
      .from(friendships)
      .where(and(eq(friendships.receiverId, userId), eq(friendships.status, 'pending')));
  }

  // Payments
  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(paymentData).returning();
    return payment;
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async updatePayment(id: number, paymentData: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set({ ...paymentData, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  // Email Verification
  async createEmailVerification(verificationData: InsertEmailVerification): Promise<EmailVerification> {
    const [verification] = await db
      .insert(emailVerifications)
      .values(verificationData)
      .returning();
    return verification;
  }

  async getEmailVerificationByToken(token: string): Promise<EmailVerification | undefined> {
    const [verification] = await db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.token, token));
    return verification;
  }

  async markEmailAsVerified(userId: number): Promise<void> {
    await db
      .update(emailVerifications)
      .set({ verified: true })
      .where(eq(emailVerifications.userId, userId));

    await db
      .update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Notifications
  async getNotifications(userId: number) {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async markNotificationAsRead(notificationId: number, userId: number) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
  }

  async createNotification(data: InsertNotification) {
    const [notification] = await db
      .insert(notifications)
      .values(data)
      .returning();
    return notification;
  }

  // Projects
  async getUserProjects(userId: number) {
    const ownedProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId));
    return ownedProjects;
  }

  async getProject(projectId: number) {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));
    return project;
  }

  async createProject(data: InsertProject) {
    const [project] = await db
      .insert(projects)
      .values(data)
      .returning();
    return project;
  }

  async updateProject(projectId: number, data: Partial<InsertProject>) {
    const [project] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, projectId))
      .returning();
    return project;
  }

  async deleteProject(projectId: number) {
    await db
      .delete(projects)
      .where(eq(projects.id, projectId));
  }

  async userHasProjectAccess(userId: number, projectId: number): Promise<boolean> {
    const [ownedProject] = await db
      .select()
      .from(projects)
      .where(and(
        eq(projects.id, projectId),
        eq(projects.userId, userId)
      ));
    return !!ownedProject;
  }

  // Tasks
  async getTasks(userId?: number, projectId?: number): Promise<Task[]> {
    if (userId && projectId) {
      return await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.projectId, projectId), eq(tasks.userId, userId)))
        .orderBy(desc(tasks.createdAt));
    } else if (projectId) {
      return await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, projectId))
        .orderBy(desc(tasks.createdAt));
    } else if (userId) {
      return await db
        .select()
        .from(tasks)
        .where(eq(tasks.userId, userId))
        .orderBy(desc(tasks.createdAt));
    } else {
      return await db
        .select()
        .from(tasks)
        .orderBy(desc(tasks.createdAt));
    }
  }

  async getTask(taskId: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    return task;
  }

  async createTask(data: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(data).returning();
    return task;
  }

  async updateTask(taskId: number, data: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, taskId))
      .returning();
    return task;
  }

  async deleteTask(taskId: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, taskId));
  }

  // Time Entries
  async getTimeEntries(userId?: number, taskId?: number): Promise<TimeEntry[]> {
    if (userId && taskId) {
      return await db
        .select()
        .from(timeEntries)
        .where(and(eq(timeEntries.taskId, taskId), eq(timeEntries.userId, userId)))
        .orderBy(desc(timeEntries.createdAt));
    } else if (taskId) {
      return await db
        .select()
        .from(timeEntries)
        .where(eq(timeEntries.taskId, taskId))
        .orderBy(desc(timeEntries.createdAt));
    } else if (userId) {
      return await db
        .select()
        .from(timeEntries)
        .where(eq(timeEntries.userId, userId))
        .orderBy(desc(timeEntries.createdAt));
    } else {
      return await db
        .select()
        .from(timeEntries)
        .orderBy(desc(timeEntries.createdAt));
    }
  }

  async getTimeEntry(entryId: number): Promise<TimeEntry | undefined> {
    const [entry] = await db.select().from(timeEntries).where(eq(timeEntries.id, entryId));
    return entry;
  }

  async createTimeEntry(data: InsertTimeEntry): Promise<TimeEntry> {
    const [entry] = await db.insert(timeEntries).values(data).returning();
    return entry;
  }

  async updateTimeEntry(entryId: number, data: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const [entry] = await db
      .update(timeEntries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(timeEntries.id, entryId))
      .returning();
    return entry;
  }

  async getActiveTimeEntry(userId: number): Promise<TimeEntry | undefined> {
    const entries = await db
      .select()
      .from(timeEntries)
      .where(and(
        eq(timeEntries.userId, userId),
        isNull(timeEntries.clockOut)
      ))
      .orderBy(desc(timeEntries.createdAt))
      .limit(1);
    return entries[0];
  }
}

export const storage = new DatabaseStorage();

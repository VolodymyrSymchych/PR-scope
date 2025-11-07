import { eq, and, or } from 'drizzle-orm';
import { db } from './db';
import {
  users,
  projects,
  teams,
  teamMembers,
  friendships,
  payments,
  emailVerifications,
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
} from '../shared/schema';

export class DatabaseStorage {
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

  async createProject(projectData: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(projectData).returning();
    return project;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getUserProjects(userId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId));
  }

  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set({ ...projectData, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

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
}

export const storage = new DatabaseStorage();

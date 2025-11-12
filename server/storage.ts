import { eq, and, or, desc, isNull, gte, lte, sql, isNotNull, inArray, sum } from 'drizzle-orm';
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
  invoices,
  expenses,
  reports,
  fileAttachments,
  projectTemplates,
  recurringInvoices,
  invoiceComments,
  invoicePayments,
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
  type Invoice,
  type InsertInvoice,
  type Expense,
  type InsertExpense,
  type Report,
  type InsertReport,
  type FileAttachment,
  type InsertFileAttachment,
  type ProjectTemplate,
  type InsertProjectTemplate,
  type RecurringInvoice,
  type InsertRecurringInvoice,
  type InvoiceComment,
  type InsertInvoiceComment,
  type InvoicePayment,
  type InsertInvoicePayment,
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

  // Helper to add workedHours to tasks from time entries
  private async addWorkedHoursToTasks(tasksArray: Task[]): Promise<(Task & { workedHours: number })[]> {
    if (tasksArray.length === 0) return [];

    const taskIds = tasksArray.map(t => t.id);

    // Get sum of duration (in minutes) for each task from time entries
    const workedHoursData = await db
      .select({
        taskId: timeEntries.taskId,
        totalMinutes: sum(timeEntries.duration),
      })
      .from(timeEntries)
      .where(inArray(timeEntries.taskId, taskIds))
      .groupBy(timeEntries.taskId);

    // Create a map of taskId -> hours
    const hoursMap = new Map<number, number>();
    workedHoursData.forEach(row => {
      if (row.taskId && row.totalMinutes) {
        // Convert minutes to hours, round to 1 decimal place
        const hours = Math.round((Number(row.totalMinutes) / 60) * 10) / 10;
        hoursMap.set(row.taskId, hours);
      }
    });

    // Add workedHours to each task
    return tasksArray.map(task => ({
      ...task,
      workedHours: hoursMap.get(task.id) || 0,
    }));
  }

  // Tasks
  async getTasks(userId?: number, projectId?: number): Promise<(Task & { workedHours: number })[]> {
    let tasksResult: Task[];

    // If projectId is provided, show all tasks for that project (user must have access)
    if (projectId) {
      // Verify user has access to the project
      if (userId) {
        const hasAccess = await this.userHasProjectAccess(userId, projectId);
        if (!hasAccess) {
          return []; // User doesn't have access to this project
        }
      }
      // Return all tasks for the project
      tasksResult = await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, projectId))
        .orderBy(desc(tasks.createdAt));
    }
    // If only userId is provided, show all tasks:
    // 1. Tasks created by the user (userId matches)
    // 2. Tasks from projects owned by the user
    else if (userId) {
      // Get all project IDs owned by the user
      const userProjects = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.userId, userId));

      const projectIds = userProjects.map(p => p.id);

      // Return tasks where:
      // - userId matches OR
      // - projectId is in user's projects
      if (projectIds.length > 0) {
        tasksResult = await db
          .select()
          .from(tasks)
          .where(
            or(
              eq(tasks.userId, userId),
              inArray(tasks.projectId, projectIds)
            )
          )
          .orderBy(desc(tasks.createdAt));
      } else {
        // No projects, return only tasks created by user
        tasksResult = await db
          .select()
          .from(tasks)
          .where(eq(tasks.userId, userId))
          .orderBy(desc(tasks.createdAt));
      }
    }
    // If neither is provided, return all tasks (shouldn't happen in normal flow)
    else {
      tasksResult = await db
        .select()
        .from(tasks)
        .orderBy(desc(tasks.createdAt));
    }

    // Add worked hours to all tasks
    return await this.addWorkedHoursToTasks(tasksResult);
  }

  async getTask(taskId: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    return task;
  }

  async createTask(data: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(data).returning();
    const [task] = result as Task[];
    if (!task) {
      throw new Error('Failed to create task');
    }
    return task;
  }

  async updateTask(taskId: number, data: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, taskId))
      .returning();
    const [task] = result as Task[];
    return task;
  }

  async deleteTask(taskId: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, taskId));
  }

  // Subtasks
  async getSubtasks(parentId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.parentId, parentId))
      .orderBy(desc(tasks.createdAt));
  }

  async createSubtask(parentId: number, data: Omit<InsertTask, 'parentId'>): Promise<Task> {
    const result = await db
      .insert(tasks)
      .values({ ...data, parentId })
      .returning();
    const [subtask] = result as Task[];
    if (!subtask) {
      throw new Error('Failed to create subtask');
    }

    // Update parent date range if subtask extends beyond parent dates
    await this.updateParentDateRange(parentId);

    return subtask;
  }

  async getTaskWithSubtasks(taskId: number): Promise<(Task & { subtasks: Task[] }) | undefined> {
    const task = await this.getTask(taskId);
    if (!task) return undefined;

    const subtasks = await this.getSubtasks(taskId);
    return { ...task, subtasks };
  }

  async updateParentDateRange(parentId: number): Promise<void> {
    const parent = await this.getTask(parentId);
    if (!parent) return;

    const subtasks = await this.getSubtasks(parentId);
    if (subtasks.length === 0) return;

    // Find min startDate and max endDate among subtasks
    let minStart = parent.startDate;
    let maxEnd = parent.endDate;

    subtasks.forEach((subtask) => {
      if (subtask.startDate) {
        if (!minStart || subtask.startDate < minStart) {
          minStart = subtask.startDate;
        }
      }
      if (subtask.endDate) {
        if (!maxEnd || subtask.endDate > maxEnd) {
          maxEnd = subtask.endDate;
        }
      }
    });

    // Update parent if dates changed
    if (
      (minStart && minStart.getTime() !== parent.startDate?.getTime()) ||
      (maxEnd && maxEnd.getTime() !== parent.endDate?.getTime())
    ) {
      await this.updateTask(parentId, {
        startDate: minStart || parent.startDate,
        endDate: maxEnd || parent.endDate,
      });
    }
  }

  async shiftSubtasks(parentId: number, daysDelta: number): Promise<void> {
    const subtasks = await this.getSubtasks(parentId);

    for (const subtask of subtasks) {
      const updates: Partial<InsertTask> = {};

      if (subtask.startDate) {
        const newStart = new Date(subtask.startDate);
        newStart.setDate(newStart.getDate() + daysDelta);
        updates.startDate = newStart;
      }

      if (subtask.endDate) {
        const newEnd = new Date(subtask.endDate);
        newEnd.setDate(newEnd.getDate() + daysDelta);
        updates.endDate = newEnd;
      }

      if (subtask.dueDate) {
        const newDue = new Date(subtask.dueDate);
        newDue.setDate(newDue.getDate() + daysDelta);
        updates.dueDate = newDue;
      }

      if (Object.keys(updates).length > 0) {
        await this.updateTask(subtask.id, updates);
      }
    }
  }

  async userCanManageTask(userId: number, taskId: number): Promise<boolean> {
    const task = await this.getTask(taskId);
    if (!task) return false;

    // Check if user owns the project
    if (task.projectId) {
      return await this.userHasProjectAccess(userId, task.projectId);
    }

    // Or if user created the task
    return task.userId === userId;
  }

  async userIsTaskAssignee(userId: number, taskId: number): Promise<boolean> {
    const task = await this.getTask(taskId);
    if (!task) return false;

    // Check if user's ID matches task's userId or if their username/email matches assignee
    if (task.userId === userId) return true;

    if (task.assignee) {
      const user = await this.getUser(userId);
      return user ? (user.username === task.assignee || user.email === task.assignee) : false;
    }

    return false;
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

  // Invoices
  async getInvoices(projectId?: number): Promise<Invoice[]> {
    if (projectId) {
      return await db
        .select()
        .from(invoices)
        .where(eq(invoices.projectId, projectId))
        .orderBy(desc(invoices.createdAt));
    }
    return await db
      .select()
      .from(invoices)
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoice(invoiceId: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    return invoice;
  }

  async createInvoice(data: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(data).returning();
    return invoice;
  }

  async updateInvoice(invoiceId: number, data: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(invoices.id, invoiceId))
      .returning();
    return invoice;
  }

  async deleteInvoice(invoiceId: number): Promise<void> {
    await db.delete(invoices).where(eq(invoices.id, invoiceId));
  }

  // Expenses
  async getExpenses(projectId?: number): Promise<Expense[]> {
    if (projectId) {
      return await db
        .select()
        .from(expenses)
        .where(eq(expenses.projectId, projectId))
        .orderBy(desc(expenses.expenseDate));
    }
    return await db
      .select()
      .from(expenses)
      .orderBy(desc(expenses.expenseDate));
  }

  async getExpense(expenseId: number): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
    return expense;
  }

  async createExpense(data: InsertExpense): Promise<Expense> {
    const [expense] = await db.insert(expenses).values(data).returning();
    return expense;
  }

  async updateExpense(expenseId: number, data: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [expense] = await db
      .update(expenses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(expenses.id, expenseId))
      .returning();
    return expense;
  }

  async deleteExpense(expenseId: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, expenseId));
  }

  // Reports
  async getReports(userId?: number, projectId?: number): Promise<Report[]> {
    const conditions = [];
    if (userId) {
      conditions.push(eq(reports.userId, userId));
    }
    if (projectId) {
      conditions.push(eq(reports.projectId, projectId));
    }
    
    if (conditions.length > 0) {
      return await db
        .select()
        .from(reports)
        .where(and(...conditions))
        .orderBy(desc(reports.updatedAt));
    }
    
    return await db.select().from(reports).orderBy(desc(reports.updatedAt));
  }

  async getReport(reportId: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, reportId));
    return report;
  }

  async createReport(data: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values(data).returning();
    return report;
  }

  async updateReport(reportId: number, data: Partial<InsertReport>): Promise<Report | undefined> {
    const [report] = await db
      .update(reports)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(reports.id, reportId))
      .returning();
    return report;
  }

  async deleteReport(reportId: number): Promise<void> {
    await db.delete(reports).where(eq(reports.id, reportId));
  }

  // Budget Metrics
  async getBudgetMetrics(userId: number): Promise<{
    totalBudget: number;
    totalSpent: number;
    utilizationPercentage: number;
    remainingBudget: number;
    forecastSpending: number;
    projectsAtRisk: number;
  }> {
    // Get all user projects with budgets
    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId));

    // Calculate total budget (in cents)
    const totalBudget = userProjects.reduce((sum, project) => {
      return sum + (project.budget || 0);
    }, 0);

    // Get all expenses for user's projects
    const projectIds = userProjects.map(p => p.id);
    let totalSpent = 0;
    let projectsAtRisk = 0;

    if (projectIds.length > 0) {
      const allExpenses = await db
        .select()
        .from(expenses)
        .where(
          or(...projectIds.map(id => eq(expenses.projectId, id)))
        );

      // Calculate total spent (in cents)
      totalSpent = allExpenses.reduce((sum, expense) => {
        return sum + (expense.amount || 0);
      }, 0);

      // Calculate spending per project and identify at-risk projects
      for (const project of userProjects) {
        if (!project.budget) continue;
        
        const projectExpenses = allExpenses.filter(e => e.projectId === project.id);
        const projectSpent = projectExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const projectUtilization = (projectSpent / project.budget) * 100;

        if (projectUtilization >= 80) {
          projectsAtRisk++;
        }
      }
    }

    // Calculate metrics
    const utilizationPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const remainingBudget = Math.max(0, totalBudget - totalSpent);

    // Calculate forecast spending based on average daily spending rate
    // Assuming 30-day month for forecast
    const daysSinceOldestProject = userProjects.length > 0 
      ? Math.max(1, Math.floor((Date.now() - new Date(userProjects[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)))
      : 30;
    const averageDailySpending = daysSinceOldestProject > 0 ? totalSpent / daysSinceOldestProject : 0;
    const forecastSpending = averageDailySpending * 30; // 30-day forecast

    return {
      totalBudget,
      totalSpent,
      utilizationPercentage,
      remainingBudget,
      forecastSpending,
      projectsAtRisk,
    };
  }

  // Cash Flow Analytics
  async getCashFlowData(userId: number, startDate: Date, endDate: Date): Promise<{
    date: string;
    income: number;
    expenses: number;
    netCashFlow: number;
  }[]> {
    // Get all user's projects
    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId));
    
    const projectIds = userProjects.map(p => p.id);
    
    if (projectIds.length === 0) {
      return [];
    }

    // Get paid invoices (income) in date range
    const paidInvoices = await db
      .select()
      .from(invoices)
      .where(
        and(
          or(...projectIds.map(id => eq(invoices.projectId, id))),
          eq(invoices.status, 'paid'),
          gte(invoices.paidDate, startDate),
          lte(invoices.paidDate, endDate)
        )
      );

    // Get expenses in date range
    const expenseRecords = await db
      .select()
      .from(expenses)
      .where(
        and(
          or(...projectIds.map(id => eq(expenses.projectId, id))),
          gte(expenses.expenseDate, startDate),
          lte(expenses.expenseDate, endDate)
        )
      );

    // Group by date
    const cashFlowMap = new Map<string, { income: number; expenses: number }>();

    paidInvoices.forEach(invoice => {
      if (!invoice.paidDate) return;
      const dateStr = new Date(invoice.paidDate).toISOString().split('T')[0];
      const existing = cashFlowMap.get(dateStr) || { income: 0, expenses: 0 };
      cashFlowMap.set(dateStr, {
        ...existing,
        income: existing.income + (invoice.totalAmount || 0),
      });
    });

    expenseRecords.forEach(expense => {
      const dateStr = new Date(expense.expenseDate).toISOString().split('T')[0];
      const existing = cashFlowMap.get(dateStr) || { income: 0, expenses: 0 };
      cashFlowMap.set(dateStr, {
        ...existing,
        expenses: existing.expenses + (expense.amount || 0),
      });
    });

    // Convert to array and sort by date
    const result = Array.from(cashFlowMap.entries())
      .map(([date, data]) => ({
        date,
        income: data.income,
        expenses: data.expenses,
        netCashFlow: data.income - data.expenses,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }

  async getCashFlowForecast(userId: number): Promise<{
    date: string;
    forecastedIncome: number;
  }[]> {
    // Get all user's projects
    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId));
    
    const projectIds = userProjects.map(p => p.id);
    
    if (projectIds.length === 0) {
      return [];
    }

    // Get pending invoices (sent but not paid)
    const pendingInvoices = await db
      .select()
      .from(invoices)
      .where(
        and(
          or(...projectIds.map(id => eq(invoices.projectId, id))),
          eq(invoices.status, 'sent'),
          isNotNull(invoices.dueDate)
        )
      );

    // Group by due date
    const forecastMap = new Map<string, number>();

    pendingInvoices.forEach(invoice => {
      if (!invoice.dueDate) return;
      const dateStr = new Date(invoice.dueDate).toISOString().split('T')[0];
      const existing = forecastMap.get(dateStr) || 0;
      forecastMap.set(dateStr, existing + (invoice.totalAmount || 0));
    });

    // Convert to array and sort by date
    const result = Array.from(forecastMap.entries())
      .map(([date, forecastedIncome]) => ({
        date,
        forecastedIncome,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }

  async getCashFlowByCategory(userId: number, startDate: Date, endDate: Date): Promise<{
    category: string;
    income: number;
    expenses: number;
  }[]> {
    // Get all user's projects
    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId));
    
    const projectIds = userProjects.map(p => p.id);
    
    if (projectIds.length === 0) {
      return [];
    }

    // Get paid invoices grouped by project
    const paidInvoices = await db
      .select()
      .from(invoices)
      .where(
        and(
          or(...projectIds.map(id => eq(invoices.projectId, id))),
          eq(invoices.status, 'paid'),
          gte(invoices.paidDate, startDate),
          lte(invoices.paidDate, endDate)
        )
      );

    // Get expenses grouped by category
    const projectExpenses = await db
      .select()
      .from(expenses)
      .where(
        and(
          or(...projectIds.map(id => eq(expenses.projectId, id))),
          gte(expenses.expenseDate, startDate),
          lte(expenses.expenseDate, endDate)
        )
      );

    // Group income by project name (as category)
    const incomeByCategory = new Map<string, number>();
    for (const invoice of paidInvoices) {
      if (invoice.projectId) {
        const project = userProjects.find(p => p.id === invoice.projectId);
        const category = project?.name || 'Other';
        const existing = incomeByCategory.get(category) || 0;
        incomeByCategory.set(category, existing + (invoice.totalAmount || 0));
      }
    }

    // Group expenses by category
    const expensesByCategory = new Map<string, number>();
    projectExpenses.forEach(expense => {
      const category = expense.category || 'other';
      const existing = expensesByCategory.get(category) || 0;
      expensesByCategory.set(category, existing + (expense.amount || 0));
    });

    // Combine all categories
    const allCategories = new Set([
      ...Array.from(incomeByCategory.keys()),
      ...Array.from(expensesByCategory.keys()),
    ]);

    const result = Array.from(allCategories).map(category => ({
      category,
      income: incomeByCategory.get(category) || 0,
      expenses: expensesByCategory.get(category) || 0,
    }));

    return result;
  }

  async getCashFlowComparison(
    userId: number,
    period: 'week' | 'month' | 'year',
    compareTo: 'previous' | 'same_last_year'
  ): Promise<{
    current: { income: number; expenses: number; netCashFlow: number };
    previous: { income: number; expenses: number; netCashFlow: number };
  }> {
    const now = new Date();
    let currentStart: Date;
    let currentEnd: Date = new Date(now);
    let previousStart: Date;
    let previousEnd: Date;

    if (period === 'week') {
      const dayOfWeek = now.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      currentStart = new Date(now);
      currentStart.setDate(now.getDate() - daysFromMonday);
      currentStart.setHours(0, 0, 0, 0);
      
      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 7);
      previousEnd = new Date(currentStart);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousEnd.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEnd = new Date(now);
      
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      previousEnd.setHours(23, 59, 59, 999);
    } else {
      // year
      currentStart = new Date(now.getFullYear(), 0, 1);
      currentEnd = new Date(now);
      
      if (compareTo === 'previous') {
        previousStart = new Date(now.getFullYear() - 1, 0, 1);
        previousEnd = new Date(now.getFullYear() - 1, 11, 31);
        previousEnd.setHours(23, 59, 59, 999);
      } else {
        previousStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        previousEnd = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0);
        previousEnd.setHours(23, 59, 59, 999);
      }
    }

    currentStart.setHours(0, 0, 0, 0);

    // Get current period data
    const currentData = await this.getCashFlowData(userId, currentStart, currentEnd);
    const current = {
      income: currentData.reduce((sum, d) => sum + d.income, 0),
      expenses: currentData.reduce((sum, d) => sum + d.expenses, 0),
      netCashFlow: currentData.reduce((sum, d) => sum + d.netCashFlow, 0),
    };

    // Get previous period data
    const previousData = await this.getCashFlowData(userId, previousStart, previousEnd);
    const previous = {
      income: previousData.reduce((sum, d) => sum + d.income, 0),
      expenses: previousData.reduce((sum, d) => sum + d.expenses, 0),
      netCashFlow: previousData.reduce((sum, d) => sum + d.netCashFlow, 0),
    };

    return { current, previous };
  }

  // File Attachments
  async createFileAttachment(fileData: InsertFileAttachment): Promise<FileAttachment> {
    const result = await db.insert(fileAttachments).values(fileData).returning();
    return (result as FileAttachment[])[0];
  }

  async getFileAttachments(projectId?: number, taskId?: number): Promise<FileAttachment[]> {
    const conditions = [];
    if (projectId) {
      conditions.push(eq(fileAttachments.projectId, projectId));
    }
    if (taskId) {
      conditions.push(eq(fileAttachments.taskId, taskId));
    }
    if (conditions.length === 0) {
      return [];
    }
    return await db
      .select()
      .from(fileAttachments)
      .where(and(...conditions))
      .orderBy(desc(fileAttachments.createdAt));
  }

  async getFileAttachment(id: number): Promise<FileAttachment | undefined> {
    const [file] = await db.select().from(fileAttachments).where(eq(fileAttachments.id, id));
    return file;
  }

  async deleteFileAttachment(id: number): Promise<void> {
    await db.delete(fileAttachments).where(eq(fileAttachments.id, id));
  }

  async getFileVersions(parentFileId: number): Promise<FileAttachment[]> {
    return await db
      .select()
      .from(fileAttachments)
      .where(eq(fileAttachments.parentFileId, parentFileId))
      .orderBy(desc(fileAttachments.version));
  }

  // Project Templates
  async getProjectTemplates(category?: string): Promise<ProjectTemplate[]> {
    if (category) {
      return await db
        .select()
        .from(projectTemplates)
        .where(eq(projectTemplates.category, category))
        .orderBy(desc(projectTemplates.usageCount));
    }
    return await db
      .select()
      .from(projectTemplates)
      .orderBy(desc(projectTemplates.usageCount));
  }

  async getProjectTemplate(id: number): Promise<ProjectTemplate | undefined> {
    const [template] = await db.select().from(projectTemplates).where(eq(projectTemplates.id, id));
    return template;
  }

  async createProjectTemplate(templateData: InsertProjectTemplate): Promise<ProjectTemplate> {
    const [template] = await db.insert(projectTemplates).values(templateData).returning();
    return template;
  }

  async incrementTemplateUsage(id: number): Promise<void> {
    await db
      .update(projectTemplates)
      .set({
        usageCount: sql`${projectTemplates.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(projectTemplates.id, id));
  }

  // Recurring Invoices
  async createRecurringInvoice(recurringData: InsertRecurringInvoice): Promise<RecurringInvoice> {
    const [recurring] = await db.insert(recurringInvoices).values(recurringData).returning();
    return recurring;
  }

  async getRecurringInvoices(projectId?: number): Promise<RecurringInvoice[]> {
    if (projectId) {
      return await db
        .select()
        .from(recurringInvoices)
        .where(eq(recurringInvoices.projectId, projectId))
        .orderBy(desc(recurringInvoices.createdAt));
    }
    return await db
      .select()
      .from(recurringInvoices)
      .orderBy(desc(recurringInvoices.createdAt));
  }

  async getRecurringInvoice(id: number): Promise<RecurringInvoice | undefined> {
    const [recurring] = await db.select().from(recurringInvoices).where(eq(recurringInvoices.id, id));
    return recurring;
  }

  async updateRecurringInvoice(id: number, updateData: Partial<InsertRecurringInvoice>): Promise<RecurringInvoice | undefined> {
    const [recurring] = await db
      .update(recurringInvoices)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(recurringInvoices.id, id))
      .returning();
    return recurring;
  }

  async getRecurringInvoicesDueForGeneration(): Promise<RecurringInvoice[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await db
      .select()
      .from(recurringInvoices)
      .where(
        and(
          eq(recurringInvoices.isActive, true),
          lte(recurringInvoices.nextGenerationDate, today),
          or(
            isNull(recurringInvoices.endDate),
            gte(recurringInvoices.endDate, today)
          )
        )
      );
  }

  // Invoice Comments
  async createInvoiceComment(commentData: any): Promise<any> {
    const [comment] = await db.insert(invoiceComments).values(commentData).returning();
    return comment;
  }

  async getInvoiceComments(invoiceId: number, includeInternal: boolean = false): Promise<any[]> {
    if (includeInternal) {
      return await db
        .select()
        .from(invoiceComments)
        .where(eq(invoiceComments.invoiceId, invoiceId))
        .orderBy(desc(invoiceComments.createdAt));
    }
    return await db
      .select()
      .from(invoiceComments)
      .where(
        and(
          eq(invoiceComments.invoiceId, invoiceId),
          eq(invoiceComments.isInternal, false)
        )
      )
      .orderBy(desc(invoiceComments.createdAt));
  }

  // Invoice Payments
  async createInvoicePayment(paymentData: any): Promise<any> {
    const [payment] = await db.insert(invoicePayments).values(paymentData).returning();
    return payment;
  }

  async getInvoicePayments(invoiceId: number): Promise<any[]> {
    return await db
      .select()
      .from(invoicePayments)
      .where(eq(invoicePayments.invoiceId, invoiceId))
      .orderBy(desc(invoicePayments.createdAt));
  }

  async updateInvoicePayment(id: number, updateData: any): Promise<any> {
    const [payment] = await db
      .update(invoicePayments)
      .set(updateData)
      .where(eq(invoicePayments.id, id))
      .returning();
    return payment;
  }

  async getInvoiceByPublicToken(token: string): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.publicToken, token));
    return invoice;
  }
}

export const storage = new DatabaseStorage();

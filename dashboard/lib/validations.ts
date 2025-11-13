import { z } from 'zod';

/**
 * Centralized validation schemas for API endpoints
 * Using Zod for runtime type checking and validation
 */

// ============================================
// COMMON SCHEMAS
// ============================================

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a positive integer'),
});

export const paginationSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 20)),
  offset: z.string().optional().transform((val) => (val ? parseInt(val) : 0)),
});

// ============================================
// PROJECT SCHEMAS
// ============================================

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Project name too long'),
  type: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  teamSize: z.string().max(50).optional(),
  timeline: z.string().max(100).optional(),
  budget: z.number().int('Budget must be an integer').positive('Budget must be positive').optional(),
  startDate: z.string().datetime('Invalid start date').optional(),
  endDate: z.string().datetime('Invalid end date').optional(),
  score: z.number().int('Score must be an integer').min(0).max(100).optional(),
  riskLevel: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
  document: z.string().optional(),
  analysisData: z.any().optional(), // JSON data
});

export const updateProjectSchema = createProjectSchema.partial();

// ============================================
// TASK SCHEMAS
// ============================================

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(500, 'Task title too long'),
  description: z.string().max(10000, 'Description too long').optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'blocked']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  project_id: z.number().positive('Invalid project ID').optional(),
  parent_id: z.number().positive('Invalid parent task ID').optional(),
  assignee: z.string().max(255).optional(),
  start_date: z.string().datetime('Invalid start date').optional(),
  due_date: z.string().datetime('Invalid due date').optional(),
  end_date: z.string().datetime('Invalid end date').optional(),
  depends_on: z.array(z.number().positive()).optional(),
  progress: z.number().min(0).max(100, 'Progress must be between 0 and 100').optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  shift_subtasks: z.boolean().optional(),
});

// ============================================
// INVOICE SCHEMAS
// ============================================

export const invoiceItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  rate: z.number().positive(),
  amount: z.number().positive(),
});

export const createInvoiceSchema = z.object({
  project_id: z.number().positive('Invalid project ID'),
  invoice_number: z.string().min(1, 'Invoice number is required').max(100),
  client_name: z.string().max(255).optional(),
  client_email: z.string().email('Invalid email').max(255).optional(),
  client_address: z.string().max(1000).optional(),
  amount: z.number().positive('Amount must be greater than zero'),
  currency: z.string().length(3, 'Currency must be 3 characters (e.g., USD)').optional(),
  tax_rate: z.number().min(0).max(100, 'Tax rate must be between 0 and 100').optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  issue_date: z.string().datetime('Invalid issue date'),
  due_date: z.string().datetime('Invalid due date').optional(),
  paid_date: z.string().datetime('Invalid paid date').optional(),
  description: z.string().max(5000).optional(),
  items: z.array(invoiceItemSchema).optional(),
  notes: z.string().max(5000).optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

// ============================================
// EXPENSE SCHEMAS
// ============================================

export const createExpenseSchema = z.object({
  project_id: z.number().positive('Invalid project ID'),
  category: z.string().min(1, 'Category is required').max(100),
  description: z.string().min(1, 'Description is required').max(5000),
  amount: z.number().positive('Amount must be greater than zero'),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  expense_date: z.string().datetime('Invalid expense date'),
  receipt_url: z.string().url('Invalid receipt URL').optional(),
  notes: z.string().max(5000).optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial().omit({ project_id: true });

// ============================================
// TIME ENTRY SCHEMAS
// ============================================

export const createTimeEntrySchema = z.object({
  task_id: z.number().positive('Invalid task ID'),
  clock_in: z.string().datetime('Invalid clock in time'),
  clock_out: z.string().datetime('Invalid clock out time').optional(),
  duration: z.number().positive('Duration must be positive').optional(),
  notes: z.string().max(1000).optional(),
});

export const updateTimeEntrySchema = createTimeEntrySchema.partial();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validates request body against a Zod schema
 * Returns parsed data or throws validation error
 */
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: result.data };
}

/**
 * Formats Zod validation errors for API response
 */
export function formatZodError(error: z.ZodError): {
  message: string;
  errors: Array<{ path: string; message: string }>;
} {
  return {
    message: 'Validation failed',
    errors: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  };
}

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { storage } from '../../../../server/storage';
import { createExpenseSchema, validateRequestBody, formatZodError } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    
    const expenses = await storage.getExpenses(
      projectId ? parseInt(projectId) : undefined
    );
    
    return NextResponse.json({ expenses });
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Validate request body
    const validation = validateRequestBody(createExpenseSchema, data);
    if (validation.success === false) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 });
    }

    const {
      project_id,
      category,
      description,
      amount,
      currency,
      expense_date,
      receipt_url,
      notes,
    } = validation.data;

    const expense = await storage.createExpense({
      projectId: project_id,
      userId: session.userId,
      category,
      description,
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency || 'usd',
      expenseDate: expense_date ? new Date(expense_date) : new Date(),
      receiptUrl: receipt_url || null,
      notes: notes || null,
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}


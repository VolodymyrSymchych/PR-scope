import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../server/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Require authentication for migration endpoint
    const migrationSecret = process.env.MIGRATION_SECRET;

    if (!migrationSecret) {
      console.error('MIGRATION_SECRET is not configured');
      return NextResponse.json(
        { error: 'Migration endpoint is not properly configured' },
        { status: 503 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${migrationSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const migrations = [
      `DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'tasks' AND column_name = 'depends_on'
          ) THEN
              ALTER TABLE tasks ADD COLUMN depends_on TEXT;
          END IF;
      END $$;`,
      `DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'tasks' AND column_name = 'progress'
          ) THEN
              ALTER TABLE tasks ADD COLUMN progress INTEGER DEFAULT 0 NOT NULL;
          END IF;
      END $$;`,
      `DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'tasks' AND column_name = 'start_date'
          ) THEN
              ALTER TABLE tasks ADD COLUMN start_date TIMESTAMP;
          END IF;
      END $$;`,
      `DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'tasks' AND column_name = 'end_date'
          ) THEN
              ALTER TABLE tasks ADD COLUMN end_date TIMESTAMP;
          END IF;
      END $$;`,
      `UPDATE tasks SET progress = 0 WHERE progress IS NULL;`,
    ];

    const results = [];
    for (const migration of migrations) {
      try {
        // @ts-ignore - drizzle-orm version mismatch between root and dashboard
        await db.execute(sql.raw(migration));
        results.push({ success: true, statement: migration.substring(0, 50) });
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message?.includes('already exists') || 
            error.message?.includes('duplicate') ||
            error.message?.includes('column') && error.message?.includes('exists')) {
          results.push({ success: true, skipped: true, statement: migration.substring(0, 50) });
        } else {
          results.push({ success: false, error: error.message, statement: migration.substring(0, 50) });
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    );
  }
}


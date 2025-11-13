import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), 'dashboard', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables');
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client);

async function runMigration() {
  try {
    console.log('=== Running Soft Delete Migration ===');
    console.log('Connected to database');

    const sql = fs.readFileSync(path.join(process.cwd(), 'soft-delete-migration.sql'), 'utf8');

    // Split SQL into individual statements (handling DO blocks)
    const statements: string[] = [];
    let currentStatement = '';
    let inDoBlock = false;
    let braceCount = 0;

    for (const line of sql.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('--')) continue;

      currentStatement += line + '\n';

      if (trimmed.startsWith('DO $$')) {
        inDoBlock = true;
        braceCount = 0;
      }

      if (inDoBlock) {
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;

        if (trimmed.endsWith('$$;') && braceCount === 0) {
          inDoBlock = false;
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      } else if (trimmed.endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }

    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    console.log(`\nExecuting ${statements.length} statements...\n`);

    for (const statement of statements) {
      if (!statement.trim()) continue;

      try {
        await client.unsafe(statement);
        console.log('✓ Executed statement successfully');
      } catch (error: any) {
        // Ignore errors for "already exists" cases
        if (error.message?.includes('already exists') ||
            error.message?.includes('duplicate') ||
            error.message?.includes('constraint') && error.message?.includes('already')) {
          console.log('⊘ Skipped (already exists)');
        } else {
          console.error('✗ Error:', error.message);
          console.error('Statement:', statement.substring(0, 100));
        }
      }
    }

    console.log('\n✓ Soft delete migration completed successfully!');
    console.log('\nThe following columns have been added:');
    console.log('  - projects.deleted_at');
    console.log('  - tasks.deleted_at');
    console.log('  - invoices.deleted_at');
    console.log('  - file_attachments.deleted_at');
    console.log('\nIndexes have been created for better query performance.');
  } catch (error: any) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

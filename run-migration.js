const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'dashboard', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✓ Connected to database');

    const sql = fs.readFileSync(path.join(__dirname, 'migrations', 'add-file-attachments.sql'), 'utf8');

    // Split SQL into individual statements
    const statements = sql.split(';').filter(s => s.trim().length > 0);

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed.length > 0) {
        try {
          await client.query(trimmed);
          const preview = trimmed.substring(0, 70).replace(/\n/g, ' ');
          console.log('✓ Executed:', preview + '...');
        } catch (error) {
          // Ignore errors for "already exists" cases
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            const preview = trimmed.substring(0, 70).replace(/\n/g, ' ');
            console.log('⊘ Skipped (already exists):', preview + '...');
          } else {
            console.error('✗ Error:', error.message);
            console.error('Statement:', trimmed.substring(0, 200));
            throw error;
          }
        }
      }
    }

    console.log('\n✓ Migration completed successfully!');
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

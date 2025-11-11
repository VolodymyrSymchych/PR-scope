/**
 * Migration script to add parentId column to tasks table
 * Run with: node run-migration.js
 */

const fs = require('fs');
const path = require('path');

// Read database configuration
const envPath = path.join(__dirname, 'dashboard', '.env.local');
let DATABASE_URL;

try {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/DATABASE_URL=(.+)/);
    if (match) {
      DATABASE_URL = match[1].trim();
    }
  }
} catch (error) {
  console.error('Error reading .env.local:', error.message);
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  console.log('\nPlease run the migration SQL manually:');
  console.log('File: migrations/add-parent-id-to-tasks.sql\n');

  const sqlPath = path.join(__dirname, 'migrations', 'add-parent-id-to-tasks.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  console.log('--- SQL Migration ---');
  console.log(sql);
  console.log('--- End SQL ---\n');

  console.log('To run manually:');
  console.log('psql YOUR_DATABASE_URL -f migrations/add-parent-id-to-tasks.sql');
  process.exit(1);
}

// Run migration using pg
(async () => {
  const { Client } = require('pg');
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read migration SQL
    const sqlPath = path.join(__dirname, 'migrations', 'add-parent-id-to-tasks.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('🔄 Running migration...');
    await client.query(sql);

    console.log('✅ Migration completed successfully!');
    console.log('\nAdded:');
    console.log('  - parent_id column to tasks table');
    console.log('  - Foreign key constraint');
    console.log('  - Index on parent_id');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);

    if (error.message.includes('already exists')) {
      console.log('\n✓ Column already exists - migration not needed');
    } else {
      process.exit(1);
    }
  } finally {
    await client.end();
  }
})();

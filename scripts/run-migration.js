const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Credentials come from the environment, never from this file:
//   SUPABASE_DB_URL="postgresql://…" node scripts/run-migration.js
// (Supabase dashboard > Project Settings > Database > Connection string.)
if (!process.env.SUPABASE_DB_URL) {
  console.error('Set SUPABASE_DB_URL to the database connection string.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Connecting to database...');

  try {
    const client = await pool.connect();
    console.log('Connected! Running migration...');

    await client.query(sql);
    console.log('Migration completed successfully!');

    client.release();
    await pool.end();
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();

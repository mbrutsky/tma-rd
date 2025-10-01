const { Pool } = require('pg');

require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function resetDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Resetting database...');
    
    // Drop all tables in reverse order
    const tables = [
      'checklist_items',
      'feedback',
      'history_entries',
      'comments',
      'task_observers',
      'task_assignees',
      'tasks',
      'business_processes',
      'users'
    ];
    
    for (const table of tables) {
      await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`Dropped table: ${table}`);
    }
    
    // Drop UUID extension
    await client.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
    
    console.log('Database reset completed successfully!');
    
  } catch (error) {
    console.error('Reset failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase();
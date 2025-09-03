import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { pool, query } from './db';

async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    // Create migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Get list of migration files
    const migrationsDir = join(__dirname, 'migrations');
    const files = await readdir(migrationsDir);
    const sqlFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort(); // Lexical order

    console.log(`Found ${sqlFiles.length} migration files`);

    // Check which migrations have already been run
    const executedResult = await query('SELECT filename FROM migrations');
    const executedMigrations = new Set(executedResult.rows.map((row: any) => row.filename));

    // Run pending migrations
    for (const filename of sqlFiles) {
      if (executedMigrations.has(filename)) {
        console.log(`Skipping already executed migration: ${filename}`);
        continue;
      }

      console.log(`Executing migration: ${filename}`);
      
      try {
        // Read and execute migration file
        const filePath = join(migrationsDir, filename);
        const sql = await readFile(filePath, 'utf-8');
        
        await query('BEGIN');
        await query(sql);
        await query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
        await query('COMMIT');
        
        console.log(`✅ Migration completed: ${filename}`);
      } catch (error) {
        await query('ROLLBACK');
        console.error(`❌ Migration failed: ${filename}`, error);
        throw error;
      }
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
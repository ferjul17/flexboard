import { sql } from '../config/database';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function runMigrations() {
  console.log('🔄 Running database migrations...\n');

  try {
    // Create migrations table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Get all migration files
    const migrationsDir = join(import.meta.dir, 'migrations');
    const files = await readdir(migrationsDir);
    const migrationFiles = files.filter((file) => file.endsWith('.sql')).sort();

    // Get already executed migrations
    const executedMigrations = await sql`
      SELECT name FROM migrations
    `;
    const executedNames = new Set(
      (executedMigrations as unknown as { name: string }[]).map((m) => m.name)
    );

    // Execute pending migrations
    for (const file of migrationFiles) {
      if (executedNames.has(file)) {
        console.log(`✅ ${file} - Already executed`);
        continue;
      }

      console.log(`📝 Executing migration: ${file}`);
      const migrationPath = join(migrationsDir, file);
      const migrationSQL = await readFile(migrationPath, 'utf-8');

      try {
        // Execute migration in a transaction
        await sql.begin(async (sql) => {
          // Execute the migration SQL
          await sql.unsafe(migrationSQL);

          // Record migration as executed
          await sql`
            INSERT INTO migrations (name) VALUES (${file})
          `;
        });

        console.log(`✅ ${file} - Executed successfully\n`);
      } catch (error) {
        console.error(`❌ ${file} - Failed to execute:`, error);
        throw error;
      }
    }

    console.log('✅ All migrations completed successfully!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

void runMigrations();

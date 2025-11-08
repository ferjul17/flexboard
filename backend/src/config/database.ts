import postgres from 'postgres';
import { env } from './env';

// Create PostgreSQL connection with error handling
export const sql = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {}, // Suppress notices in logs
  debug: env.NODE_ENV === 'development',
});

// Test database connection with retry logic
export async function testConnection(retries = 3, delay = 2000) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sql`SELECT 1`;
      console.log('✅ Database connection established');
      return;
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Database connection attempt ${attempt}/${retries} failed:`, error);

      if (attempt < retries) {
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error('❌ Database connection failed after all retries');
  throw lastError;
}

// Check database health
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Close database connection
export async function closeConnection() {
  try {
    await sql.end({ timeout: 5 });
    console.log('Database connection closed gracefully');
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connection...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing database connection...');
  await closeConnection();
  process.exit(0);
});

import { neon } from '@neondatabase/serverless';
import { env } from './environment';

let dbConnection: any = null;

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    if (!env.DATABASE_URL) {
      console.warn('DATABASE_URL not configured');
      return false;
    }

    const sql = neon(env.DATABASE_URL);
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export function getDatabaseConnection() {
  if (!dbConnection && env.DATABASE_URL) {
    dbConnection = neon(env.DATABASE_URL);
  }
  return dbConnection;
}
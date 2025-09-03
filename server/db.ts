import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

let pool: any;
let query: any;
let testConnection: any;

if (!DATABASE_URL) {
  console.warn('Warning: DATABASE_URL not found. Using mock database mode.');
  // Create a mock pool that doesn't actually connect
  const mockPool = {
    query: async () => ({ rows: [], rowCount: 0 }),
    end: async () => {}
  };
  pool = mockPool as any;
  query = async (text: string, params?: any[]) => {
    console.log('Mock query:', text);
    return { rows: [], rowCount: 0 };
  };
  testConnection = async () => {
    console.log('Mock database connection - no real database configured');
  };
} else {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  query = async (text: string, params?: any[]) => {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  };

  // Test connection
  testConnection = async () => {
    try {
      await query('SELECT NOW()');
      console.log('Database connection successful');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  };
}

export { pool, query, testConnection };
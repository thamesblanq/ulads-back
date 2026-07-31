import 'dotenv/config';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

export const db = new Pool({
  connectionString,

  max: 20,

  idleTimeoutMillis: 30000,

  connectionTimeoutMillis: 2000,

  allowExitOnIdle: true,
});

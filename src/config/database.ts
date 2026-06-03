import 'dotenv/config';
import { Pool, PoolConfig } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const config: PoolConfig = { connectionString };

export const db = new Pool(config);

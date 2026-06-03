import 'dotenv/config';
import { db } from '../src/config/database';

async function test() {
  const result = await db.query('SELECT NOW()');

  console.log(result.rows);
}

void test();

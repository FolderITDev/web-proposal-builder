import { afterAll, beforeEach } from 'vitest';

import { createDatabase } from '../../src/server/db/client';
import { proposals } from '../../src/server/db/schema';
import { seedDatabase } from '../../src/server/db/seed';
import { TEST_DATABASE_URL } from './database-url';

process.env.DATABASE_URL = TEST_DATABASE_URL;
const { db, sql } = createDatabase(TEST_DATABASE_URL, { max: 2 });

beforeEach(async () => {
  await db.delete(proposals);
  await seedDatabase(db);
});

afterAll(async () => {
  await sql.end();
});

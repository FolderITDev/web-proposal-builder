import { afterAll, beforeAll, beforeEach } from 'vitest';

import { createDatabase } from '../../src/server/db/client';
import { proposals } from '../../src/server/db/schema';
import { seedDatabase } from '../../src/server/db/seed';
import { type DocumentRendererDouble, startDocumentRenderer } from '../support/document-renderer';
import { TEST_DATABASE_URL } from './database-url';

process.env.DATABASE_URL = TEST_DATABASE_URL;

export let renderer: DocumentRendererDouble | undefined;

/** The renderer is read from the environment on first use, so it must be listening before then. */
beforeAll(async () => {
  renderer = await startDocumentRenderer();
  process.env.DOCUMENT_RENDERER_URL = renderer.url;
});
const { db, sql } = createDatabase(TEST_DATABASE_URL, { max: 2 });

beforeEach(async () => {
  await db.delete(proposals);
  await seedDatabase(db);
});

afterAll(async () => {
  await sql.end();
  await renderer?.close();
});

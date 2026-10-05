import { eq } from 'drizzle-orm';

import { EXAMPLE_PROPOSALS } from '@/content/example-proposals';
import { addDays, documentTotals } from '@/domain/proposal/document';

import { type Database } from '../client';
import { createProposalRepository } from '../../repositories/proposal-repository';
import { proposals } from '../schema';

const DAY = 24 * 60 * 60 * 1000;

/**
 * Replaces the example proposals with fresh copies. Visitor proposals are left untouched, so
 * the seed is safe to run against a live database.
 */
export async function seedDatabase(db: Database, now = new Date()): Promise<number> {
  await db.delete(proposals).where(eq(proposals.isExample, true));
  const repository = createProposalRepository(db);
  for (const example of [...EXAMPLE_PROPOSALS].reverse()) {
    const createdAt = new Date(now.getTime() - (example.daysAgo + 3) * DAY);
    // Validity follows the creation date, so seeded proposals age like real ones.
    const document = {
      ...example.document,
      terms: {
        ...example.document.terms,
        validUntil: addDays(createdAt.toISOString().slice(0, 10), 30),
      },
    };
    await repository.insert({
      document,
      ownerHash: null,
      status: example.status,
      totalMinor: documentTotals(example.document).total,
      createdAt,
      updatedAt: new Date(now.getTime() - example.daysAgo * DAY - 3_600_000),
    });
  }
  return EXAMPLE_PROPOSALS.length;
}

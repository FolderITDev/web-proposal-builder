import { and, asc, count, desc, eq, ilike, isNotNull, lt, or, type SQL, sql } from 'drizzle-orm';

import { formatProposalNumber, type ProposalStatus } from '@/domain/proposal/status';
import { type ListProposalsQuery, type ProposalDocument } from '@/lib/validation/proposal';

import { type Database } from '../db/client';
import {
  lineItems,
  milestones,
  type ProposalRow,
  type ProposalWithChildren,
  proposalNumberSequence,
  proposals,
  scopeItems,
} from '../db/schema';
import { documentChildren, documentColumns } from './mapping';

type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

const WITH_CHILDREN = { scopeItems: true, lineItems: true, milestones: true } as const;

/** Rows the visitor may see: every example plus their own proposals. */
function visibleTo(ownerHash: string | null): SQL {
  return ownerHash
    ? (or(eq(proposals.isExample, true), eq(proposals.ownerHash, ownerHash)) as SQL)
    : eq(proposals.isExample, true);
}

const ORDER_BY = {
  'updated-desc': [desc(proposals.updatedAt), desc(proposals.id)],
  'updated-asc': [asc(proposals.updatedAt), asc(proposals.id)],
  'total-desc': [desc(proposals.totalMinor), desc(proposals.updatedAt)],
  'total-asc': [asc(proposals.totalMinor), desc(proposals.updatedAt)],
  'number-desc': [desc(proposals.number)],
} as const;

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

async function insertChildren(tx: Transaction, proposalId: string, document: ProposalDocument) {
  const children = documentChildren(proposalId, document);
  if (children.scopeItems.length) await tx.insert(scopeItems).values(children.scopeItems);
  if (children.lineItems.length) await tx.insert(lineItems).values(children.lineItems);
  if (children.milestones.length) await tx.insert(milestones).values(children.milestones);
}

export type InsertProposal = {
  document: ProposalDocument;
  ownerHash: string | null;
  status?: ProposalStatus;
  totalMinor: number;
  createdAt: Date;
  updatedAt?: Date;
};

/** Data access for proposals. Knows SQL and transactions, knows nothing about HTTP or rules. */
export function createProposalRepository(db: Database) {
  async function findById(where: SQL): Promise<ProposalWithChildren | undefined> {
    return db.query.proposals.findFirst({ where, with: WITH_CHILDREN });
  }

  return {
    async insert({
      document,
      ownerHash,
      status = 'draft',
      totalMinor,
      createdAt,
      updatedAt,
    }: InsertProposal) {
      return db.transaction(async (tx) => {
        const [{ sequence } = { sequence: 0 }] = await tx.execute<{ sequence: string }>(
          sql`select nextval(${proposalNumberSequence.seqName}) as sequence`,
        );
        const [row] = await tx
          .insert(proposals)
          .values({
            ...documentColumns(document),
            number: formatProposalNumber(createdAt.getUTCFullYear(), Number(sequence)),
            ownerHash,
            isExample: ownerHash === null,
            status,
            totalMinor,
            createdAt,
            updatedAt: updatedAt ?? createdAt,
          })
          .returning({ id: proposals.id });
        if (!row) throw new Error('Insert returned no row.');
        await insertChildren(tx, row.id, document);
        return row.id;
      });
    },

    findVisible(id: string, ownerHash: string | null) {
      return findById(and(eq(proposals.id, id), visibleTo(ownerHash)) as SQL);
    },

    findByShareToken(token: string) {
      return findById(eq(proposals.shareToken, token));
    },

    async list(query: ListProposalsQuery, ownerHash: string | null) {
      const visible = visibleTo(ownerHash);
      const filters = [visible];
      if (query.status) filters.push(eq(proposals.status, query.status));
      if (query.q) {
        const pattern = `%${escapeLike(query.q)}%`;
        filters.push(
          or(
            ilike(proposals.title, pattern),
            ilike(proposals.clientCompany, pattern),
            ilike(proposals.number, pattern),
          ) as SQL,
        );
      }
      const where = and(...filters);

      const [rows, [totals], perStatus] = await Promise.all([
        db
          .select()
          .from(proposals)
          .where(where)
          .orderBy(...ORDER_BY[query.sort])
          .limit(query.pageSize)
          .offset((query.page - 1) * query.pageSize),
        db.select({ total: count() }).from(proposals).where(where),
        db
          .select({ status: proposals.status, total: count() })
          .from(proposals)
          .where(visible)
          .groupBy(proposals.status),
      ]);
      return { rows: rows as ProposalRow[], total: totals?.total ?? 0, perStatus };
    },

    /**
     * Writes a new version if, and only if, the stored version still matches. Returns false when
     * another save won the race, so the caller can report a conflict instead of overwriting it.
     */
    async update(
      id: string,
      ownerHash: string,
      expectedVersion: number,
      changes: {
        document?: ProposalDocument;
        status?: ProposalStatus;
        totalMinor?: number;
        updatedAt: Date;
      },
    ): Promise<boolean> {
      return db.transaction(async (tx) => {
        const [row] = await tx
          .update(proposals)
          .set({
            ...(changes.document ? documentColumns(changes.document) : {}),
            ...(changes.status ? { status: changes.status } : {}),
            ...(changes.totalMinor !== undefined ? { totalMinor: changes.totalMinor } : {}),
            version: sql`${proposals.version} + 1`,
            updatedAt: changes.updatedAt,
          })
          .where(
            and(
              eq(proposals.id, id),
              eq(proposals.ownerHash, ownerHash),
              eq(proposals.version, expectedVersion),
            ),
          )
          .returning({ id: proposals.id });
        if (!row) return false;
        if (changes.document) {
          await tx.delete(scopeItems).where(eq(scopeItems.proposalId, id));
          await tx.delete(lineItems).where(eq(lineItems.proposalId, id));
          await tx.delete(milestones).where(eq(milestones.proposalId, id));
          await insertChildren(tx, id, changes.document);
        }
        return true;
      });
    },

    async deleteOwned(id: string, ownerHash: string): Promise<boolean> {
      const deleted = await db
        .delete(proposals)
        .where(and(eq(proposals.id, id), eq(proposals.ownerHash, ownerHash)))
        .returning({ id: proposals.id });
      return deleted.length > 0;
    },

    /** Visitor proposals untouched for the retention period are removed; examples stay. */
    async deleteInactive(updatedBefore: Date): Promise<number> {
      const deleted = await db
        .delete(proposals)
        .where(and(isNotNull(proposals.ownerHash), lt(proposals.updatedAt, updatedBefore)))
        .returning({ id: proposals.id });
      return deleted.length;
    },
  };
}

export type ProposalRepository = ReturnType<typeof createProposalRepository>;

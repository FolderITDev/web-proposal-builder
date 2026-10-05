import { z } from 'zod';

import { documentTotals } from '@/domain/proposal/document';
import { canTransition, isEditable, STATUS_LABEL } from '@/domain/proposal/status';
import { documentFromTemplate } from '@/domain/proposal/templates';
import {
  CreateProposalSchema,
  type ListProposalsQuery,
  type Proposal,
  type ProposalList,
  type UpdateProposal,
} from '@/lib/validation/proposal';

import { type ProposalWithChildren } from '../db/schema';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../errors';
import { rowToDocument } from '../repositories/mapping';
import { type ProposalRepository } from '../repositories/proposal-repository';

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

type Dependencies = { repository: ProposalRepository; now?: () => Date };

export function toProposal(row: ProposalWithChildren, ownerHash: string | null): Proposal {
  const document = rowToDocument(row);
  const owned = ownerHash !== null && row.ownerHash === ownerHash;
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    version: row.version,
    isExample: row.isExample,
    canEdit: owned && isEditable(row.status),
    shareToken: row.shareToken,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    document,
    totals: documentTotals(document),
  };
}

const notFound = () => new NotFoundError('No proposal with this ID.');

/**
 * Use cases for proposals. Route handlers call these; nothing here knows about HTTP, and the
 * repository is injected so tests run against a real, isolated database.
 */
export function createProposalService({ repository, now = () => new Date() }: Dependencies) {
  async function get(id: string, ownerHash: string | null): Promise<Proposal> {
    if (!z.uuid().safeParse(id).success) throw notFound();
    const row = await repository.findVisible(id, ownerHash);
    if (!row) throw notFound();
    return toProposal(row, ownerHash);
  }

  async function purgeInactive() {
    await repository.deleteInactive(new Date(now().getTime() - RETENTION_MS));
  }

  return {
    get,

    async getShared(token: string): Promise<Proposal> {
      if (!z.uuid().safeParse(token).success) throw notFound();
      const row = await repository.findByShareToken(token);
      if (!row) throw notFound();
      return toProposal(row, null);
    },

    async list(query: ListProposalsQuery, ownerHash: string | null): Promise<ProposalList> {
      const { rows, total, perStatus } = await repository.list(query, ownerHash);
      const counts = { draft: 0, sent: 0, accepted: 0, declined: 0 };
      for (const { status, total: value } of perStatus) counts[status] = value;
      return {
        items: rows.map((row) => ({
          id: row.id,
          number: row.number,
          title: row.title,
          clientCompany: row.clientCompany,
          status: row.status,
          currency: row.currency,
          totalMinor: row.totalMinor,
          validUntil: row.validUntil,
          isExample: row.isExample,
          updatedAt: row.updatedAt.toISOString(),
        })),
        page: query.page,
        pageSize: query.pageSize,
        total,
        counts,
      };
    },

    async create(body: unknown, ownerHash: string): Promise<Proposal> {
      const { template } = CreateProposalSchema.parse(body ?? {});
      await purgeInactive();
      const createdAt = now();
      const document = documentFromTemplate(template, createdAt.toISOString().slice(0, 10));
      const id = await repository.insert({
        document,
        ownerHash,
        totalMinor: documentTotals(document).total,
        createdAt,
      });
      return get(id, ownerHash);
    },

    /** Copies any visible proposal, including examples, into a new draft owned by the visitor. */
    async duplicate(id: string, ownerHash: string): Promise<Proposal> {
      const source = await get(id, ownerHash);
      await purgeInactive();
      const document = {
        ...source.document,
        title: `Copy of ${source.document.title}`.slice(0, 160),
      };
      const newId = await repository.insert({
        document,
        ownerHash,
        totalMinor: source.totals.total,
        createdAt: now(),
      });
      return get(newId, ownerHash);
    },

    /**
     * Saves a document and/or a status change against the version the client started from.
     * Only the owner's drafts accept document changes; status follows the lifecycle rules.
     */
    async update(id: string, ownerHash: string | null, body: UpdateProposal): Promise<Proposal> {
      const current = await get(id, ownerHash);
      if (current.isExample || !ownerHash) {
        throw new ForbiddenError(
          'Example proposals are read-only. Duplicate this one to edit your own copy.',
        );
      }
      if (body.version !== current.version) {
        throw new ConflictError(
          'This proposal was changed in another tab or window. Reload it to see the latest version.',
        );
      }
      if (body.document && !isEditable(current.status)) {
        throw new ValidationError(
          `${STATUS_LABEL[current.status]} proposals are frozen. Move it back to draft to edit it.`,
          [{ path: 'status', message: 'Only drafts can be edited.' }],
        );
      }
      if (body.status && !canTransition(current.status, body.status)) {
        throw new ValidationError(`A ${current.status} proposal cannot become ${body.status}.`, [
          { path: 'status', message: 'This status change is not allowed.' },
        ]);
      }

      const document = body.document;
      const saved = await repository.update(id, ownerHash, body.version, {
        document,
        status: body.status,
        totalMinor: document ? documentTotals(document).total : undefined,
        updatedAt: now(),
      });
      if (!saved) {
        throw new ConflictError(
          'This proposal was changed in another tab or window. Reload it to see the latest version.',
        );
      }
      return get(id, ownerHash);
    },

    async remove(id: string, ownerHash: string | null): Promise<void> {
      const proposal = await get(id, ownerHash);
      if (proposal.isExample) throw new ForbiddenError('Example proposals cannot be deleted.');
      if (!ownerHash || !(await repository.deleteOwned(id, ownerHash))) throw notFound();
    },
  };
}

export type ProposalService = ReturnType<typeof createProposalService>;

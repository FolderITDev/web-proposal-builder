import 'server-only';

import { db } from '../db';
import { createProposalRepository } from '../repositories/proposal-repository';
import { createProposalService } from './proposal-service';

/** Composition root: wires the service to the shared database pool. */
export function proposalService() {
  return createProposalService({ repository: createProposalRepository(db()) });
}

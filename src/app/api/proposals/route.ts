import { BASE_PATH } from '@/config/site';
import {
  ListProposalsQuerySchema,
  ProposalListSchema,
  ProposalSchema,
} from '@/lib/validation/proposal';
import { limitCreations } from '@/server/http/creation-limit';
import { handle, json, readJsonBody } from '@/server/http/responses';
import { ensureSession, readSession } from '@/server/http/session';
import { proposalService } from '@/server/services';

/** Lists the example proposals plus the visitor's own, with search, a status filter and paging. */
export const GET = handle(async (request) => {
  const query = ListProposalsQuerySchema.parse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  const list = await proposalService().list(query, readSession(request));
  return json(ProposalListSchema, list, { headers: { 'Cache-Control': 'private, no-store' } });
});

/** Creates a draft from a template. Responds 201 with the proposal and its Location. */
export const POST = handle(async (request) => {
  limitCreations(request);
  const session = ensureSession(request);
  const proposal = await proposalService().create(await readJsonBody(request), session.ownerHash);

  const headers = new Headers({
    Location: `${BASE_PATH}/api/proposals/${proposal.id}`,
    'Set-Cookie': session.setCookie,
  });
  return json(ProposalSchema, proposal, { status: 201, headers });
});

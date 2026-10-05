import { BASE_PATH } from '@/config/site';
import { ProposalSchema } from '@/lib/validation/proposal';
import { limitCreations } from '@/server/http/creation-limit';
import { handle, json } from '@/server/http/responses';
import { ensureSession } from '@/server/http/session';
import { proposalService } from '@/server/services';

/** Copies a visible proposal, including examples, into a new draft owned by the caller. */
export const POST = handle<RouteContext<'/api/proposals/[id]/duplicate'>>(
  async (request, { params }) => {
    limitCreations(request);
    const { id } = await params;
    const session = ensureSession(request);
    const proposal = await proposalService().duplicate(id, session.ownerHash);

    const headers = new Headers({
      Location: `${BASE_PATH}/api/proposals/${proposal.id}`,
      'Set-Cookie': session.setCookie,
    });
    return json(ProposalSchema, proposal, { status: 201, headers });
  },
);

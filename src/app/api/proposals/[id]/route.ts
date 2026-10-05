import { ProposalSchema, UpdateProposalSchema } from '@/lib/validation/proposal';
import { handle, json, readJsonBody } from '@/server/http/responses';
import { readSession, renewSession } from '@/server/http/session';
import { proposalService } from '@/server/services';

type Context = RouteContext<'/api/proposals/[id]'>;

const PRIVATE = { 'Cache-Control': 'private, no-store' };

/** One proposal with its document and server-computed totals. */
export const GET = handle<Context>(async (request, { params }) => {
  const { id } = await params;
  const proposal = await proposalService().get(id, readSession(request));
  return json(ProposalSchema, proposal, { headers: PRIVATE });
});

/**
 * Saves the document and/or the status against the version the client read. A stale version
 * is rejected with 409, so two tabs can never silently overwrite each other.
 */
export const PATCH = handle<Context>(async (request, { params }) => {
  const { id } = await params;
  const body = UpdateProposalSchema.parse(await readJsonBody(request));
  const proposal = await proposalService().update(id, readSession(request), body);
  const cookie = renewSession(request);
  return json(ProposalSchema, proposal, {
    headers: cookie ? { ...PRIVATE, 'Set-Cookie': cookie } : PRIVATE,
  });
});

/** Deletes one of the visitor's own proposals. Examples cannot be deleted. */
export const DELETE = handle<Context>(async (request, { params }) => {
  const { id } = await params;
  await proposalService().remove(id, readSession(request));
  return new Response(null, { status: 204 });
});

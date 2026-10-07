import { handle } from '@/server/http/responses';
import { pdfResponse } from '@/server/http/pdf-response';
import { readSession } from '@/server/http/session';
import { proposalService } from '@/server/services';

/** The proposal as a PDF, rendered by the document renderer from the saved document. */
export const GET = handle<RouteContext<'/api/proposals/[id]/pdf'>>(async (request, { params }) => {
  const { id } = await params;
  return pdfResponse(await proposalService().get(id, readSession(request)));
});

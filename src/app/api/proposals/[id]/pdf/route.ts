import { handle } from '@/server/http/responses';
import { pdfResponse } from '@/server/http/pdf-response';
import { limitRenders } from '@/server/http/render-limit';
import { readSession } from '@/server/http/session';
import { proposalService } from '@/server/services';

/** The proposal as a PDF, rendered by the document renderer from the saved document. */
export const GET = handle<RouteContext<'/api/proposals/[id]/pdf'>>(async (request, { params }) => {
  limitRenders(request);
  const { id } = await params;
  return pdfResponse(await proposalService().get(id, readSession(request)));
});

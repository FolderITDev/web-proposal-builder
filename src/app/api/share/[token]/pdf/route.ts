import { handle } from '@/server/http/responses';
import { pdfResponse } from '@/server/http/pdf-response';
import { proposalService } from '@/server/services';

/** The PDF behind a share link. The unguessable token is the only credential. */
export const GET = handle<RouteContext<'/api/share/[token]/pdf'>>(async (_request, { params }) => {
  const { token } = await params;
  return pdfResponse(await proposalService().getShared(token));
});

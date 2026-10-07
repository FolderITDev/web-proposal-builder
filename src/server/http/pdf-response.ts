import { type Proposal } from '@/lib/validation/proposal';

import { documentRenderer, DocumentRendererError } from '../document-renderer';
import { ServiceUnavailableError } from '../errors';

/** Renders a proposal through the document renderer and returns it as a downloadable PDF. */
export async function pdfResponse(proposal: Proposal): Promise<Response> {
  let pdf: Uint8Array;
  try {
    pdf = await documentRenderer.renderProposalPdf(proposal);
  } catch (error) {
    if (!(error instanceof DocumentRendererError)) throw error;
    console.error('PDF rendering failed', { proposal: proposal.number, error });
    throw new ServiceUnavailableError(
      'renderer_unavailable',
      'The PDF could not be generated right now. Try again in a moment.',
    );
  }
  return new Response(pdf.slice(), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${proposal.number}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}

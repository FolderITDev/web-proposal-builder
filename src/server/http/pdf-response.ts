import { type Proposal } from '@/lib/validation/proposal';

import { renderProposalPdf } from '../pdf/proposal-pdf';

/** Streams a rendered proposal as a downloadable PDF named after its number. */
export async function pdfResponse(proposal: Proposal): Promise<Response> {
  const pdf = await renderProposalPdf(proposal);
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${proposal.number}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}

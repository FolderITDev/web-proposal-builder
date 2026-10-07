import { describe, expect, it, vi } from 'vitest';

import { type Proposal } from '@/lib/validation/proposal';
import { createDocumentRenderer, DocumentRendererError } from '@/server/document-renderer/client';

const proposal = {
  id: '6f1c2b8e-0000-4000-8000-000000000001',
  number: 'PB-2026-0042',
  status: 'draft',
  shareToken: 'share-token-that-must-stay-private',
  document: { title: 'Mobile app' },
  totals: { total: 100 },
} as unknown as Proposal;

const pdfResponse = () =>
  new Response(new TextEncoder().encode('%PDF-1.7\n%%EOF\n'), {
    headers: { 'content-type': 'application/pdf' },
  });

describe('document renderer client', () => {
  it('posts the document and totals, never the share token, and returns the PDF', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => pdfResponse());
    const renderer = createDocumentRenderer({ baseUrl: 'https://render.test', apiKey: 'k', fetch });

    const bytes = await renderer.renderProposalPdf(proposal);

    expect(new TextDecoder().decode(bytes.subarray(0, 5))).toBe('%PDF-');
    const [url, init] = fetch.mock.calls[0]!;
    expect(String(url)).toBe('https://render.test/v1/documents');
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer k');
    expect(JSON.parse(String(init?.body))).toEqual({
      template: 'proposal',
      format: 'pdf',
      proposal: {
        number: 'PB-2026-0042',
        status: 'draft',
        document: { title: 'Mobile app' },
        totals: { total: 100 },
      },
    });
  });

  it('rejects an answer that is not a PDF', async () => {
    const renderer = createDocumentRenderer({
      baseUrl: 'https://render.test',
      fetch: async () => Response.json({ ok: true }),
    });
    await expect(renderer.renderProposalPdf(proposal)).rejects.toThrow('did not return a PDF');
  });

  it('reports HTTP and network failures as renderer errors', async () => {
    const failing = createDocumentRenderer({
      baseUrl: 'https://render.test',
      fetch: async () => new Response('busy', { status: 503 }),
    });
    await expect(failing.renderProposalPdf(proposal)).rejects.toBeInstanceOf(DocumentRendererError);

    const unreachable = createDocumentRenderer({
      baseUrl: 'https://render.test',
      fetch: async () => {
        throw new TypeError('fetch failed');
      },
    });
    await expect(unreachable.renderProposalPdf(proposal)).rejects.toThrow('could not be reached');
  });
});

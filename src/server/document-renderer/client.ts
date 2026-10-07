import { type Proposal } from '@/lib/validation/proposal';

/** What the renderer receives: the document and its totals, never IDs or share tokens. */
export type ProposalRenderRequest = {
  template: 'proposal';
  format: 'pdf';
  proposal: Pick<Proposal, 'number' | 'status' | 'document' | 'totals'>;
};

export type DocumentRenderer = {
  /** Renders a proposal and returns the PDF bytes. */
  renderProposalPdf(proposal: Proposal): Promise<Uint8Array>;
};

/** The renderer could not be reached, refused the request or answered outside its contract. */
export class DocumentRendererError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'DocumentRendererError';
  }
}

const PDF_MAGIC = '%PDF-';

type ClientOptions = {
  baseUrl: string;
  apiKey?: string | undefined;
  timeoutMs?: number;
  fetch?: typeof globalThis.fetch;
};

/** HTTP client for the document rendering service, configured with its base URL. */
export function createDocumentRenderer({
  baseUrl,
  apiKey,
  timeoutMs = 20_000,
  fetch = globalThis.fetch,
}: ClientOptions): DocumentRenderer {
  const root = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  return {
    async renderProposalPdf({ number, status, document, totals }) {
      const body: ProposalRenderRequest = {
        template: 'proposal',
        format: 'pdf',
        proposal: { number, status, document, totals },
      };
      const headers = new Headers({
        Accept: 'application/pdf',
        'Content-Type': 'application/json',
      });
      if (apiKey) headers.set('Authorization', `Bearer ${apiKey}`);

      let response: Response;
      try {
        response = await fetch(new URL('v1/documents', root), {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          cache: 'no-store',
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (cause) {
        throw new DocumentRendererError('The document renderer could not be reached.', { cause });
      }
      if (!response.ok) {
        throw new DocumentRendererError(`The document renderer answered ${response.status}.`);
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') ?? '';
      if (
        !contentType.startsWith('application/pdf') ||
        new TextDecoder().decode(bytes.subarray(0, PDF_MAGIC.length)) !== PDF_MAGIC
      ) {
        throw new DocumentRendererError('The document renderer did not return a PDF.');
      }
      return bytes;
    },
  };
}

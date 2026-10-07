import 'server-only';

import { documentRendererEnv } from '../env';
import { createDocumentRenderer, type DocumentRenderer, DocumentRendererError } from './client';

export { DocumentRendererError } from './client';

let configured: DocumentRenderer | undefined;

function renderer(): DocumentRenderer {
  if (!configured) {
    const settings = documentRendererEnv.safeParse();
    if (!settings.success) {
      throw new DocumentRendererError('DOCUMENT_RENDERER_URL is missing or invalid.', {
        cause: settings.error,
      });
    }
    configured = createDocumentRenderer({
      baseUrl: settings.data.DOCUMENT_RENDERER_URL,
      apiKey: settings.data.DOCUMENT_RENDERER_API_KEY,
    });
  }
  return configured;
}

/**
 * The document renderer at DOCUMENT_RENDERER_URL. Configuration is read on the first render, so
 * the editor and the share pages keep working while the renderer is misconfigured.
 */
export const documentRenderer: DocumentRenderer = {
  renderProposalPdf: (proposal) => renderer().renderProposalPdf(proposal),
};

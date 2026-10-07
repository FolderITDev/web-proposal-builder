import { createServer } from 'node:http';
import { type AddressInfo } from 'node:net';

import { type ProposalRenderRequest } from '../../src/server/document-renderer/client';

/**
 * Test double of the document renderer, so integration and end-to-end tests exercise the real
 * HTTP client against the documented contract. It checks the request and answers with a
 * one-page PDF that carries the proposal number.
 */

function onePagePdf(text: string): Buffer {
  const content = `BT /F1 18 Tf 72 720 Td (${text.replace(/[()\\]/g, '')}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.7\n';
  const offsets = objects.map((object, index) => {
    const offset = pdf.length;
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

export type DocumentRendererDouble = {
  url: string;
  requests: ProposalRenderRequest[];
  close: () => Promise<void>;
};

export async function startDocumentRenderer(port = 0): Promise<DocumentRendererDouble> {
  const requests: ProposalRenderRequest[] = [];

  const server = createServer(async (request, response) => {
    const path = new URL(request.url ?? '/', 'http://renderer.local').pathname;
    if (request.method !== 'POST' || path !== '/v1/documents') {
      response.writeHead(404).end();
      return;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(chunk as Buffer);
    let body: Partial<ProposalRenderRequest> = {};
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as ProposalRenderRequest;
    } catch {
      // Answered below as an invalid request.
    }
    if (body.template !== 'proposal' || body.format !== 'pdf' || !body.proposal?.number) {
      response.writeHead(422, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ code: 'invalid_request' }));
      return;
    }
    requests.push(body as ProposalRenderRequest);
    response.writeHead(200, { 'content-type': 'application/pdf' });
    response.end(onePagePdf(`Proposal ${body.proposal.number}`));
  });

  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));
  const { port: bound } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${bound}`,
    requests,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

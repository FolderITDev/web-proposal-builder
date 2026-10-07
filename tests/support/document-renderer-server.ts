import { startDocumentRenderer } from './document-renderer';

/** Runs the document renderer test double for the end-to-end tests (see playwright.config.ts). */
const port = Number(process.env.PORT ?? 3029);
const renderer = await startDocumentRenderer(port);
process.stdout.write(`Document renderer test double listening on ${renderer.url}\n`);

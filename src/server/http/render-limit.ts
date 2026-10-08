import { clientKey, createRateLimiter } from './rate-limit';

/**
 * Every PDF download is rendered by the document renderer, and share links are public, so
 * downloads have their own budget per client: enough for real use, not for running the renderer
 * in a loop.
 */
const renders = createRateLimiter({ limit: 30, windowMs: 10 * 60 * 1000 });

export function limitRenders(request: Request): void {
  renders.consume(clientKey(request));
}

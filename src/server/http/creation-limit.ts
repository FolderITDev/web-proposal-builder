import { clientKey, createRateLimiter } from './rate-limit';

/**
 * Creating and duplicating both add proposals, so they share one budget per client. Reads and
 * saves are not limited.
 */
const creations = createRateLimiter({ limit: 30, windowMs: 10 * 60 * 1000 });

export function limitCreations(request: Request): void {
  creations.consume(clientKey(request));
}

import { type z } from 'zod';

import { BASE_PATH } from '@/config/site';
import { ProblemSchema } from '@/lib/validation/proposal';

export const API_ROOT = `${BASE_PATH}/api`;

/** A failed API call, carrying the RFC 9457 problem the server returned when there was one. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors: readonly { path: string; message: string }[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function toApiError(status: number, body: unknown): ApiError {
  const problem = ProblemSchema.safeParse(body);
  if (problem.success) {
    return new ApiError(
      status,
      problem.data.code,
      problem.data.detail ?? problem.data.title,
      problem.data.errors,
    );
  }
  return new ApiError(status, 'unexpected_response', 'The server returned an unexpected response.');
}

async function send(path: string, init: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      'network_error',
      'The server could not be reached. Check your connection and try again.',
    );
  }
  if (!response.ok) throw toApiError(response.status, await readJson(response));
  return response;
}

/** Calls the API and validates the response body against its contract. */
export async function apiRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  init: { method?: 'GET' | 'POST' | 'PATCH'; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const response = await send(path, {
    method: init.method ?? 'GET',
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: init.signal,
  });
  return schema.parse(await response.json());
}

export async function apiDelete(path: string): Promise<void> {
  await send(path, { method: 'DELETE' });
}

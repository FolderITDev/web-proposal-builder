import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.url({
    message: 'DATABASE_URL must be a postgres:// URL. Copy .env.example to .env.',
  }),
});

const DocumentRendererEnvSchema = z.object({
  DOCUMENT_RENDERER_URL: z.url({
    protocol: /^https?$/,
    message: 'DOCUMENT_RENDERER_URL must be the http(s) base URL of the document renderer.',
  }),
  DOCUMENT_RENDERER_API_KEY: z
    .string()
    .optional()
    .transform((value) => value || undefined),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

/** Server environment, validated on first use so a misconfiguration fails with a clear message. */
export function env(): Env {
  cached ??= EnvSchema.parse(process.env);
  return cached;
}

/** Document renderer settings, validated separately so database-only scripts do not need them. */
export const documentRendererEnv = {
  safeParse: () => DocumentRendererEnvSchema.safeParse(process.env),
};

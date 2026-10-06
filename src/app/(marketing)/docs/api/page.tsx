import { type Metadata } from 'next';

import { absoluteUrl, BASE_PATH, siteConfig } from '@/config/site';
import { breadcrumbJsonLd, JsonLd } from '@/lib/seo/json-ld';
import { pageMetadata } from '@/lib/seo/metadata';
import { openApiDocument } from '@/server/openapi';

const description =
  'REST API reference for Proposal Builder: create, list, save and delete proposals, export PDFs and use share links. Optimistic concurrency, OpenAPI 3.1, RFC 9457 errors.';

export const metadata: Metadata = pageMetadata({
  path: '/docs/api',
  title: 'API reference',
  description,
});

type Operation = {
  summary: string;
  description?: string;
  operationId: string;
  parameters?: {
    name: string;
    in: string;
    required?: boolean;
    description?: string;
    schema: Record<string, unknown>;
  }[];
  requestBody?: {
    required?: boolean;
    content: Record<string, { schema: { $ref?: string } }>;
  };
  responses: Record<
    string,
    { description: string; content?: Record<string, { schema: { $ref?: string } }> }
  >;
};

const METHODS = ['get', 'post', 'patch', 'delete'] as const;

function schemaName(ref: string | undefined) {
  return ref?.split('/').pop();
}

function describeSchema(schema: Record<string, unknown>): string {
  const parts = [String(schema.type ?? 'string')];
  if (Array.isArray(schema.enum)) parts.push(`one of ${schema.enum.join(', ')}`);
  if (schema.default !== undefined) parts.push(`default ${String(schema.default)}`);
  if (schema.maximum !== undefined) parts.push(`max ${String(schema.maximum)}`);
  if (schema.maxLength !== undefined) parts.push(`max length ${String(schema.maxLength)}`);
  if (schema.format) parts.push(String(schema.format));
  return parts.join(' · ');
}

export default function ApiReferencePage() {
  const document = openApiDocument();
  const base = `${BASE_PATH}/api`;
  const operations = Object.entries(document.paths).flatMap(([path, item]) =>
    METHODS.flatMap((method) => {
      const operation = (item as Partial<Record<(typeof METHODS)[number], Operation>>)[method];
      return operation ? [{ path, method, operation }] : [];
    }),
  );

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Folder IT', url: siteConfig.company.url },
          { name: siteConfig.name, url: absoluteUrl('/') },
          { name: 'API reference', url: absoluteUrl('/docs/api') },
        ])}
      />
      <div className="mx-auto grid max-w-[88rem] gap-14 px-5 py-14 sm:px-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:py-20">
        <nav aria-label="Operations" className="lg:sticky lg:top-8 lg:self-start">
          <ul className="flex flex-col border-t border-ink">
            {operations.map(({ path, method, operation }) => (
              <li key={operation.operationId} className="border-b border-rule">
                <a
                  href={`#${operation.operationId}`}
                  className="flex flex-col gap-0.5 py-3 hover:text-ink-2"
                >
                  <span className="text-[0.9375rem] font-[540]">{operation.summary}</span>
                  <span className="font-mono text-xs break-all text-ink-3">
                    {method.toUpperCase()} {path}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-16">
          <header className="flex max-w-3xl flex-col gap-5">
            <h1 className="serif text-title font-[330]">API reference</h1>
            <p className="text-lead text-ink-2">{document.info.description}</p>
            <dl className="grid gap-x-10 border-y border-rule py-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1 py-2">
                <dt className="index text-ink-2">Base URL</dt>
                <dd className="font-mono text-sm break-all">{document.servers[0]?.url}</dd>
              </div>
              <div className="flex flex-col gap-1 py-2">
                <dt className="index text-ink-2">OpenAPI document</dt>
                <dd>
                  <a
                    href={`${base}/openapi.json`}
                    className="font-mono text-sm text-ink underline underline-offset-4"
                  >
                    {base}/openapi.json
                  </a>
                </dd>
              </div>
              <div className="flex flex-col gap-1 py-2">
                <dt className="index text-ink-2">Authentication</dt>
                <dd className="text-[0.9375rem]">
                  None. Your own proposals are tied to an anonymous HttpOnly cookie.
                </dd>
              </div>
              <div className="flex flex-col gap-1 py-2">
                <dt className="index text-ink-2">Errors</dt>
                <dd className="text-[0.9375rem]">
                  <code className="font-mono text-sm">application/problem+json</code> (RFC 9457)
                  with a stable <code className="font-mono text-sm">code</code>.
                </dd>
              </div>
            </dl>
            <pre
              tabIndex={0}
              aria-label="Example request"
              className="overflow-x-auto rounded-sm bg-ink p-5 font-mono text-[0.8125rem] leading-relaxed text-white"
            >
              <code>{`curl -i -X POST ${document.servers[0]?.url}/proposals \\
  -H "Content-Type: application/json" \\
  -d '{"template":"web-app"}'

# HTTP/1.1 201 Created
# Location: ${base}/proposals/{id}`}</code>
            </pre>
          </header>

          {operations.map(({ path, method, operation }) => {
            const body = schemaName(
              operation.requestBody?.content['application/json']?.schema.$ref,
            );
            return (
              <section
                key={operation.operationId}
                id={operation.operationId}
                aria-labelledby={`${operation.operationId}-title`}
                className="flex scroll-mt-8 flex-col gap-6 border-t border-ink pt-8"
              >
                <div className="flex flex-col gap-3">
                  <h2
                    id={`${operation.operationId}-title`}
                    className="serif text-heading font-[400]"
                  >
                    {operation.summary}
                  </h2>
                  <p className="flex flex-wrap items-center gap-3 font-mono text-sm">
                    <span className="rounded-sm bg-sunk px-2 py-0.5 font-[600] text-ink uppercase">
                      {method}
                    </span>
                    <span className="break-all">{path}</span>
                  </p>
                  {operation.description ? (
                    <p className="max-w-[68ch] leading-relaxed text-ink-2">
                      {operation.description}
                    </p>
                  ) : null}
                </div>

                {operation.parameters?.length ? (
                  <div
                    className="overflow-x-auto"
                    tabIndex={0}
                    role="region"
                    aria-label={`${operation.summary}: parameters`}
                  >
                    <table className="w-full min-w-[36rem] border-collapse text-left text-[0.9375rem]">
                      <caption className="pb-2 text-left index text-ink-2">Parameters</caption>
                      <tbody>
                        {operation.parameters.map((parameter) => (
                          <tr key={parameter.name} className="border-b border-rule">
                            <th
                              scope="row"
                              className="py-2.5 pr-6 font-mono text-sm font-normal whitespace-nowrap"
                            >
                              {parameter.name}
                              {parameter.required ? <span className="text-ink-3"> *</span> : null}
                            </th>
                            <td className="py-2.5 pr-6 text-ink-3">{parameter.in}</td>
                            <td className="py-2.5 text-ink-2">
                              {[parameter.description, describeSchema(parameter.schema)]
                                .filter(Boolean)
                                .join(' — ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {body ? (
                  <p className="text-[0.9375rem] text-ink-2">
                    Request body:{' '}
                    <code className="font-mono text-sm text-ink">application/json</code>, schema{' '}
                    <code className="font-mono text-sm text-ink">{body}</code>
                    {operation.requestBody?.required ? '' : ' (optional)'}.
                  </p>
                ) : null}

                <div
                  className="overflow-x-auto"
                  tabIndex={0}
                  role="region"
                  aria-label={`${operation.summary}: responses`}
                >
                  <table className="w-full min-w-[36rem] border-collapse text-left text-[0.9375rem]">
                    <caption className="pb-2 text-left index text-ink-2">Responses</caption>
                    <tbody>
                      {Object.entries(operation.responses).map(([status, response]) => {
                        const ref = schemaName(
                          Object.values(response.content ?? {})[0]?.schema.$ref,
                        );
                        return (
                          <tr key={status} className="border-b border-rule">
                            <th
                              scope="row"
                              className="w-20 py-2.5 pr-6 font-mono text-sm font-normal"
                            >
                              {status}
                            </th>
                            <td className="py-2.5 pr-6 text-ink-2">{response.description}</td>
                            <td className="py-2.5 text-right font-mono text-sm text-ink-3">
                              {ref ?? ''}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}

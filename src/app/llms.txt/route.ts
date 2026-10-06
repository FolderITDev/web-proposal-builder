import { absoluteUrl, siteConfig } from '@/config/site';
import { CURRENCIES } from '@/domain/proposal/money';

/**
 * A plain-text summary for language models and AI search (llmstxt.org): what the application
 * is, who built it, how it works and where its documentation lives.
 */
export function GET() {
  const body = `# ${siteConfig.name}

> ${siteConfig.shortDescription} Built and maintained by ${siteConfig.company.name} (${siteConfig.company.url}).

${siteConfig.name} is a full-stack web application built with Next.js (App Router), React, strict TypeScript, PostgreSQL and Drizzle ORM. A proposal has a client, a project, scope items marked included or excluded, priced services, a discount, tax, a payment schedule and branding. The editor shows a live preview and autosaves with optimistic concurrency; PDFs are rendered on the server from the same document model.

Amounts are integer minor units. Totals are computed by one function shared by the editor, the API and the PDF: line totals rounded once, discount capped at the subtotal, tax on the discounted amount, and milestone amounts split by largest remainder so they add up exactly. Supported currencies: ${CURRENCIES.join(', ')}.

${siteConfig.company.description}

## Pages

- [Home](${absoluteUrl('/')}): what the builder does, how pricing is calculated, features and an FAQ
- [API reference](${absoluteUrl('/docs/api')}): REST endpoints, parameters and responses
- [OpenAPI 3.1 document](${absoluteUrl('/api/openapi.json')})
- [Source code](${siteConfig.repositoryUrl}): MIT licensed
`;
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}

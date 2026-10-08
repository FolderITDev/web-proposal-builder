# Architecture and decisions

Proposal Builder is a Next.js application with its own REST API and PostgreSQL database. Public pages are prerendered; the editor is a client application that talks to the API; PDFs come from an external document renderer.

## Layers

```text
src/app/(marketing)    Server Components     → landing page and API reference, example data priced at build time
src/app/(tool)         thin pages            → dashboard, template picker, editor
src/app/p/[token]      Server Component      → read-only share page, reads through the service
src/features/          client components     → React Hook Form, TanStack Query, autosave
src/lib/api/           browser client        → fetch, Zod-parsed responses, ApiError
src/app/api/           Route Handlers        → parse input, call a service, validate output
src/server/services/   use cases             → templates, lifecycle, ownership, versions
src/server/repositories/ data access         → Drizzle queries and transactions, document ↔ rows
src/server/document-renderer/ HTTP client   → the only code that knows DOCUMENT_RENDERER_URL
src/domain/proposal/   pure rules            → money, totals, milestones, status, templates
PostgreSQL             four tables           → proposals and their ordered child rows
```

## Money

- **Units.** Amounts are integer minor units; every supported currency has two minor digits. Quantities are stored as hundredths. Rates and shares are basis points.
- **Order of operations.** Each line is `round(quantityHundredths × unitPriceMinor / 100)`. The subtotal is their sum. A percentage discount is `round(subtotal × bps / 10000)`; a fixed discount is used as is; both are capped at the subtotal. Tax is `round(taxable × bps / 10000)` on the discounted amount. Rounding is half up and happens once per step.
- **Milestones.** `splitByBasisPoints` floors each share and gives the remaining cents to the largest remainders, ties to the earliest milestone, so the amounts always add up to the total.
- **One implementation.** The preview calls `previewTotals`, which only replaces half-typed numbers with zero before calling `documentTotals`. The API calls `documentTotals` on the validated document and stores the total for sorting. The PDF and share page receive the totals from the service.

## Saving

1. The editor keeps the document in React Hook Form with `ProposalDocumentSchema` as resolver, so errors appear as the person types.
2. `useAutosave` derives the state on every render: invalid, unsaved, saving, saved, failed or conflicted. When the document is valid and differs from the last saved snapshot, it waits 900 ms and sends `PATCH { version, document }`.
3. The service checks ownership, editability and the version, then the repository runs `UPDATE … WHERE id = ? AND owner_hash = ? AND version = ?` and replaces the scope items, line items and milestones in the same transaction.
4. If no row was updated, another save won: the API answers 409, the editor stops autosaving and offers to reload the latest version. If the person leaves with unsaved changes, the browser asks first.

## Lifecycle

`draft → sent → accepted | declined`, with `sent → draft` and `declined → draft` to reopen. Only drafts are editable; an accepted proposal is final and can only be duplicated. Status changes use the same versioned `PATCH`.

## Persistence

- **Normalized lists.** Scope items, line items and milestones are child tables ordered by `position`, with a unique index per proposal and position, cascading on delete.
- **Constraints in the database.** Checks keep quantities positive, prices non-negative, tax rates and milestone shares in range, brand colors in hex form, and every proposal either an example or owned.
- **Numbering.** A PostgreSQL sequence feeds `PB-<year>-<sequence>`, unique by index.
- **Derived total.** `total_minor` is written on every save so the dashboard can sort by value.
- **Mapping.** `mapping.ts` converts between the API document and rows in both directions; it is the only place that knows both shapes.

## Documents

`ProposalSheet` renders the HTML document for the preview, the share page and the landing page. Logos are described once as primitives (`logoShapes`).

PDFs come from the document renderer, an external service at `DOCUMENT_RENDERER_URL` (with an optional bearer token in `DOCUMENT_RENDERER_API_KEY`). Both PDF routes call `POST /v1/documents` with:

```json
{
  "template": "proposal",
  "format": "pdf",
  "proposal": { "number": "…", "status": "…", "document": {}, "totals": {} }
}
```

`document` and `totals` are the `ProposalDocument` and `Totals` contracts, so the PDF prints the totals the server computed, never a second calculation. IDs and share tokens are never sent. The renderer answers `application/pdf`; the client checks the content type and the `%PDF-` signature and gives up after 20 seconds. Any failure becomes a `503` problem with the code `renderer_unavailable`, and configuration is read on the first render, so the rest of the application works while the renderer is unavailable.

## Privacy model

Visitors are anonymous. The first proposal sets an HttpOnly, SameSite=Lax cookie scoped to the app path, valid for seven days and renewed on every write; only the SHA-256 hash of its token is stored. Visitors see examples and their own proposals; other IDs return 404. Share links use a random UUID per proposal and are the only way to read a proposal you do not own. Proposals untouched for seven days are deleted on the next creation.

## Rendering and caching

Cache Components and Partial Prefetching are enabled. The landing page, template picker and API reference are static; the example proposal on the landing page is priced at build time by the domain functions. The editor and share pages prerender a shell and stream their content. Route Handlers that read the request are dynamic.

## Verification

- Vitest `unit`: money, totals, splits, lifecycle, templates and document validation.
- Vitest `components`: the sheet, the sub-dial, inputs and badges in jsdom.
- Vitest `integration`: Route Handlers called with real `Request` objects against PostgreSQL, including PDF export against a double of the renderer's API.
- Playwright: the main flows and axe WCAG 2.2 AA scans against a production build, at desktop and mobile sizes.

## Deployment

The app is built with `basePath: '/apps/proposal-builder'`. Set `SITE_ORIGIN` to the public origin at build time, and `DOCUMENT_RENDERER_URL` (plus `DOCUMENT_RENDERER_API_KEY` if needed) at runtime. The rate limiter is in process; a multi-instance deployment should move it to a shared store.

Rate limits count requests per client address. Set `TRUSTED_PROXY_HOPS` to the number of reverse proxies in front of the app (default 1): the address is read that many entries from the right of `X-Forwarded-For`, so a client cannot choose its own key by sending the header.

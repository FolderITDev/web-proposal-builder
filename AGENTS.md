# Proposal Builder

Instructions for anyone, human or AI coding agent, changing this repository. Read this file, [DESIGN.md](DESIGN.md) and [docs/architecture.md](docs/architecture.md) before editing.

Proposal Builder is a full-stack web application for writing commercial proposals: client, project, scope, services, pricing, terms and branding, with a live preview, autosave, PDF export and share links. It is built and maintained by Folder IT.

The document renderer at `DOCUMENT_RENDERER_URL`, which produces the PDFs, is the only external service. There is no account system and no email delivery. PostgreSQL stores proposals in normalized tables.

**Stack:** Next.js 16 (App Router, Cache Components, Route Handlers) · React 19 · TypeScript 6 (strict) · Tailwind CSS 4 · TanStack Query 5 · React Hook Form + Zod 4 · Drizzle ORM · PostgreSQL 17 · Vitest · Playwright · pnpm 10 · Node.js 24.

This version of Next.js has breaking changes from older releases. Read the relevant guide in `node_modules/next/dist/docs/` before using an API.

---

## Commands

| Command                             | Purpose                                                            |
| ----------------------------------- | ------------------------------------------------------------------ |
| `pnpm install`                      | Install the locked dependencies.                                   |
| `docker compose up -d`              | Start PostgreSQL on port 5442 (development and test databases).    |
| `pnpm db:migrate` / `pnpm db:seed`  | Apply migrations / replace the example proposals.                  |
| `pnpm db:generate`                  | Generate a SQL migration after changing `src/server/db/schema.ts`. |
| `pnpm dev`                          | Development server on http://localhost:3020/apps/proposal-builder. |
| `pnpm check`                        | ESLint, route typegen + `tsc`, and every Vitest project.           |
| `pnpm format` / `pnpm format:check` | Prettier with Tailwind class sorting.                              |
| `pnpm build` then `pnpm test:e2e`   | Production build and Playwright end-to-end tests.                  |

## Project structure

| Location                  | Responsibility                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/`                | Routes only: `(marketing)` public pages, `(tool)` noindex tool pages, `p/[token]` share page, `api/` Route Handlers, metadata files. |
| `src/domain/proposal/`    | Pure rules: money, totals, milestone splitting, status lifecycle, templates.                                                         |
| `src/server/`             | Server-only: services, repositories and mapping, Drizzle schema and seed, document renderer client, HTTP helpers, OpenAPI.           |
| `src/lib/validation/`     | Zod contracts for every request and response, including the editable document.                                                       |
| `src/features/proposals/` | Editor sections and inputs, autosave, dashboard, TanStack Query options.                                                             |
| `src/components/`         | Design system components documented in DESIGN.md.                                                                                    |
| `src/content/`            | Example proposals and FAQ copy.                                                                                                      |
| `tests/`, `e2e/`          | Vitest (unit, components, integration) and Playwright.                                                                               |

---

## Critical rules (always apply)

### R1. Layers point one way

UI → API client → Route Handler → service → repository → database. Components never import from `src/server`; Route Handlers contain no business logic; repositories contain no rules. `src/domain` imports nothing from React, Next.js or the database.

### R2. Money is integers, computed once

Amounts are integer minor units, quantities are hundredths, rates and shares are basis points. Totals come only from `computeTotals` / `documentTotals`, used by the preview, the API, the share page and the PDF. Never add a second calculation, never use floating point for an amount, and keep milestone splits exact with `splitByBasisPoints`.

### R3. Contracts are Zod schemas

Every request body, query string and response body has a schema in `src/lib/validation`. Handlers parse input with it and respond through `json(schema, body)`. Schemas that appear in the API carry `.meta({ id })` so the OpenAPI document references them. The editor validates with the same `ProposalDocumentSchema`.

### R4. Saves are versioned

Every `PATCH` carries the version the client read; the repository updates only when it still matches and returns false otherwise, which the service turns into a 409. Never add a write path that skips the version check. The editor must stop autosaving on a conflict and offer a reload.

### R5. Lifecycle and ownership live in the service

Only the owner's drafts accept document changes. Status changes follow `canTransition`. Examples are read-only and can only be duplicated. Do not rely on disabled buttons for any of these rules.

### R6. Errors are typed problems

Throw `AppError` subclasses from `src/server/errors.ts`. `handle()` turns them into RFC 9457 problems and calls `unstable_rethrow` first. Document new codes in `docs/api.md`.

### R7. Schema changes are migrations

Change `src/server/db/schema.ts`, run `pnpm db:generate`, commit the SQL in `drizzle/`, update `mapping.ts` in both directions and cover it in an integration test. Never edit an applied migration.

### R8. One document, many renderers

`ProposalSheet` (HTML) renders `ProposalDocument` and `ProposalTotals`; the PDF routes send the same two contracts to the document renderer through `src/server/document-renderer`, and nothing else (never IDs or share tokens). A field added to the document is added to the sheet and documented for the renderer, and the contract double in `tests/support/document-renderer.ts` is updated with the client.

### R9. Public pages stay indexable and static

Pages in `(marketing)` render on the server, use `pageMetadata()` and keep JSON-LD in sync with visible content. Tool pages live in `(tool)` (`noindex`); share pages are `noindex, nofollow`. New public pages go into `sitemap.ts`.

### R10. Use the design system, keep it accessible

Follow [DESIGN.md](DESIGN.md): tokens from `globals.css`, components from `src/components`, brass as a single detail, serif for display and documents only. Every input is labelled, statuses are words, scroll regions are focusable and errors are announced. The axe checks in `e2e/` must stay at zero violations.

---

## Adding or changing a feature

1. Change the contract in `src/lib/validation` and, for pricing, the domain functions with unit tests first.
2. Persist through the schema, a migration and `mapping.ts`; expose it through a service and a thin Route Handler, with an integration test against PostgreSQL.
3. Add the field to the editor section and the HTML sheet, and make sure the renderer receives it.
4. Design loading, empty, error, read-only and conflict states.
5. Update the OpenAPI document, DESIGN.md, the README and the landing copy when visible behavior changes.

## Definition of done

- `pnpm check`, `pnpm format:check`, `pnpm build` and `pnpm test:e2e` pass.
- Money changes are covered by unit tests that check exact cents.
- English copy, in sentence case, with no claims the application does not support.
- Never report a check as passing unless it ran. Guidelines for AI-assisted changes are in [docs/ai-engineering.md](docs/ai-engineering.md).

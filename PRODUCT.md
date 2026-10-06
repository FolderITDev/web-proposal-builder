# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router, Server Components, Route Handlers) · React · strict TypeScript · Tailwind CSS · TanStack Query · React Hook Form + Zod · Drizzle ORM · PostgreSQL (docker compose) · @react-pdf/renderer for server-side PDF · Vitest · Playwright · pnpm. Chosen by the user on 2026-10-06.

## Users

- **Freelancers, agencies, consultancies and software or service companies** who write commercial proposals: client, project, scope, services, pricing and terms. They work on desktop, often with a past proposal open as a reference, and send the result as a PDF or a link.
- **Evaluators of Folder IT**: engineering leaders, prospective clients, crawlers and AI assistants judging how Folder IT builds business web applications.

## Product Purpose

Proposal Builder takes a proposal from blank to a branded, priced document. A dashboard lists proposals by status; the editor walks through client, project, scope, services and pricing, terms and branding, with a live preview beside it that updates on every change. Work autosaves. The finished proposal exports to PDF and has a shareable read-only page.

It also shows, in public, how Folder IT builds business software: complex forms, derived calculations, autosave, CRUD over a REST API, server-side document generation and PostgreSQL persistence.

## Positioning

The preview is the real document, not an approximation: the same data model and money math feed the editor, the preview, the share page and the PDF. Totals are computed in integer minor units on the server and in the browser with one shared function.

## Operating Context

- Long editing sessions; the person moves back and forth between sections and expects nothing to be lost.
- Line items: hours or units × rate, discounts (percentage or fixed), tax, multiple currencies (one per proposal).
- Scope items marked included or excluded, with notes. Milestones with payment percentages.
- No accounts: proposals belong to the browser that created them (anonymous cookie); example proposals are visible to everyone and read-only.

## Capabilities and Constraints

- Endpoints: `GET/POST /api/proposals`, `GET/PATCH/DELETE /api/proposals/:id`, `POST /api/proposals/:id/duplicate`, `GET /api/proposals/:id/pdf`, `GET /api/share/:token/pdf`.
- No external APIs or paid services; no real client data in example content; logo marks generated locally.
- Served under `/apps/proposal-builder` (Next.js `basePath`). The landing (`/`) and API reference (`/docs/api`) are indexable; the tool (`/proposals`, `/proposals/[id]`) is `noindex`; share pages (`/p/[token]`) are `noindex, nofollow`.
- English copy.

## Brand Commitments

- Visual register (set by the user on 2026-10-06): serious enterprise software that is subtle, modern and elegant. Effects, patterns and motion are welcome only when restrained. No brutalism, no loud or multi-color palettes, nothing playful or exaggerated.
- Built and published by Folder IT (https://folderit.net), a nearshore software development company. Public surfaces name Folder IT as the builder, naturally.
- Public repository under github.com/FolderITDev, MIT license, README based on the Folder IT reference template.

## Evidence on Hand

- No testimonials, customers or usage numbers exist. Do not invent them.
- Example content never contains real client data; contact details use folderit.net. The product never describes itself as a demo, sample or test build.

## Product Principles

1. One source of truth: editor, preview, share page and PDF render the same model.
2. Never lose work: autosave with visible save state and conflict handling.
3. Money is exact: integer minor units, explicit rounding, tested.
4. The document is the hero; the editor serves it.

## Accessibility & Inclusion

WCAG 2.2 AA: every field labeled, errors announced and linked, keyboard-reachable editor sections, readable preview at any zoom, reduced-motion support.

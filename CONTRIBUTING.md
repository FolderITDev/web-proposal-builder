# Contributing

Use the Node.js version pinned in `.node-version` (24) and the pnpm version pinned in `package.json`, run `pnpm install`, and read `AGENTS.md`, `DESIGN.md` and `docs/architecture.md` before editing. Keep changes small and in scope; all code, UI copy and documentation are English.

Start PostgreSQL with `docker compose up -d`, then run `pnpm db:migrate` and `pnpm db:seed`. Before opening a pull request, run `pnpm check`, `pnpm format:check`, `pnpm build` and `pnpm test:e2e`. Pricing changes need unit tests that assert exact cents. Interface changes need desktop and mobile screenshots and a note on the loading, empty, error, read-only and conflict states you checked; document changes need a rendered PDF page.

Never commit real proposals, client data, credentials, customer code or build output. New dependencies require a demonstrated need and a license review. AI-assisted contributions require human review of the diff and the same verification as any other contribution.

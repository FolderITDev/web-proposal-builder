# Security and privacy

Proposal Builder is a public web application without accounts. Proposals are linked to an anonymous HttpOnly cookie, stored as the SHA-256 hash of its token, and deleted after seven days without changes. Anyone holding a proposal's share link can read it. It is not designed to hold confidential commercial information.

## Reporting a vulnerability

Report vulnerabilities privately through [GitHub private vulnerability reporting](https://github.com/FolderITDev/web-proposal-builder/security/advisories/new). Do not disclose personal data or exploitable details in public issues. For anything else, contact Folder IT through [folderit.net](https://folderit.net).

This is a static reference repository without a support commitment; reports are reviewed on a best-effort basis.

## Controls in place

- Every request body, query string and response body is validated with Zod; malformed JSON is rejected with a 422.
- SQL is built with Drizzle's parameterized queries, and search terms escape `LIKE` wildcards.
- Visitors can only read example proposals, their own proposals and proposals whose share token they hold; other IDs return 404. Only owners can edit or delete, only drafts accept document changes, and every save is checked against the stored version.
- Database constraints guard quantities, prices, rates, shares, colors and ownership independently of the application.
- Share pages are `noindex, nofollow` and send no referrer.
- A per-client rate limit applies to proposal creation.
- Security headers: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and `Permissions-Policy`. The `X-Powered-By` header is disabled.

## Dependency advisories

At the time of writing, `pnpm audit --prod` reports no known vulnerabilities in production dependencies. Development-only tooling reports a high advisory in `braces` through `eslint-config-next` ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)) and a moderate one in an old `esbuild` through `drizzle-kit` ([GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)); neither ships in the production build. Recheck `pnpm audit` before publication.

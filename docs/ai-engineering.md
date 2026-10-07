# AI-assisted engineering

Proposal Builder runs no AI inference. AI coding agents are used as development tools, and their changes meet the same bar as any other change.

1. **Constraints first.** Give the agent [AGENTS.md](../AGENTS.md) and [DESIGN.md](../DESIGN.md) as explicit constraints, with a bounded task and observable acceptance criteria.
2. **Real APIs only.** Resolve framework APIs against the documentation shipped in `node_modules/next/dist/docs/` and the installed type definitions. Reject invented APIs, options and packages.
3. **Money stays in code.** Pricing lives in pure, tested functions that work in integer cents. Model output never computes, rounds or rewrites an amount.
4. **Review every diff.** Check for unnecessary dependencies, secrets, weakened validation or version checks, accessibility regressions and claims the application does not support.
5. **Verify.** Run `pnpm check`, `pnpm format:check`, `pnpm build` and `pnpm test:e2e`. Never report a check as passing unless it ran.
6. **Data boundaries.** Never give a model real proposals, client data, prices or credentials. The example proposals in this repository contain no real client data for that reason.

## Model-assisted drafting

Any feature that suggests a project summary or scope descriptions with a language model must:

- run on the server with server-side credentials and a per-request budget;
- produce text only, never amounts, quantities, dates or terms;
- show suggestions the author explicitly accepts, and keep them editable;
- treat existing proposal text as untrusted data, never as instructions;
- be evaluated on a versioned set of example briefs for accuracy, tone and refusals before release.

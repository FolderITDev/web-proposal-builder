import { describe, expect, it } from 'vitest';

import {
  DELETE as deleteProposal,
  GET as getProposal,
  PATCH as patchProposal,
} from '@/app/api/proposals/[id]/route';
import { POST as duplicateProposal } from '@/app/api/proposals/[id]/duplicate/route';
import { GET as getPdf } from '@/app/api/proposals/[id]/pdf/route';
import { GET as listProposals, POST as createProposal } from '@/app/api/proposals/route';
import { GET as getSharedPdf } from '@/app/api/share/[token]/pdf/route';
import { GET as getOpenApi } from '@/app/api/openapi.json/route';
import { BASE_PATH } from '@/config/site';
import {
  ProblemSchema,
  type Proposal,
  ProposalListSchema,
  ProposalSchema,
} from '@/lib/validation/proposal';

import { renderer } from './setup';

const API = `http://localhost${BASE_PATH}/api`;
const params = (id: string) => ({ params: Promise.resolve({ id }) });

function request(path: string, init: RequestInit & { cookie?: string } = {}) {
  const headers = new Headers(init.headers);
  if (init.cookie) headers.set('cookie', init.cookie);
  if (init.body) headers.set('content-type', 'application/json');
  return new Request(`${API}${path}`, { ...init, headers });
}

function cookieFrom(response: Response): string {
  const header = response.headers.get('set-cookie');
  if (!header) throw new Error('Expected a Set-Cookie header.');
  return header.split(';')[0] ?? '';
}

async function create(template = 'web-app', cookie?: string) {
  const response = await createProposal(
    request('/proposals', { method: 'POST', body: JSON.stringify({ template }), cookie }),
    undefined,
  );
  const proposal = ProposalSchema.parse(await response.json());
  return { response, proposal, cookie: cookie ?? cookieFrom(response) };
}

async function patch(proposal: Proposal, body: object, cookie: string) {
  const response = await patchProposal(
    request(`/proposals/${proposal.id}`, { method: 'PATCH', body: JSON.stringify(body), cookie }),
    params(proposal.id),
  );
  return { response, body: await response.json() };
}

async function list(query = '', cookie?: string) {
  const response = await listProposals(request(`/proposals${query}`, { cookie }), undefined);
  return ProposalListSchema.parse(await response.json());
}

describe('POST /api/proposals', () => {
  it('creates a draft from a template with server-computed totals', async () => {
    const { response, proposal } = await create('web-app');
    expect(response.status).toBe(201);
    expect(response.headers.get('location')).toBe(`${BASE_PATH}/api/proposals/${proposal.id}`);
    expect(proposal).toMatchObject({
      status: 'draft',
      version: 1,
      isExample: false,
      canEdit: true,
    });
    expect(proposal.number).toMatch(/^PB-\d{4}-\d{4}$/);
    expect(proposal.totals.total).toBe(750_000);
    expect(proposal.totals.milestones).toEqual([225_000, 225_000, 300_000]);
  });

  it('rejects an unknown template', async () => {
    const response = await createProposal(
      request('/proposals', { method: 'POST', body: '{"template":"novel"}' }),
      undefined,
    );
    expect(response.status).toBe(422);
  });

  it('rejects malformed JSON', async () => {
    const response = await createProposal(
      request('/proposals', { method: 'POST', body: '{' }),
      undefined,
    );
    expect(response.status).toBe(422);
    expect(ProblemSchema.parse(await response.json()).detail).toBe(
      'The request body is not valid JSON.',
    );
  });
});

describe('PATCH /api/proposals/:id', () => {
  it('saves a document, recomputes totals and bumps the version', async () => {
    const { proposal, cookie } = await create();
    const document = {
      ...proposal.document,
      lineItems: [{ ...proposal.document.lineItems[0]!, quantity: 12.5, unitPriceMinor: 3_333 }],
      pricing: {
        ...proposal.document.pricing,
        currency: 'EUR',
        taxRateBps: 2_100,
        taxLabel: 'VAT',
      },
    };
    const { response, body } = await patch(proposal, { version: 1, document }, cookie);
    expect(response.status).toBe(200);
    const saved = ProposalSchema.parse(body);
    expect(saved.version).toBe(2);
    expect(saved.totals).toMatchObject({ subtotal: 41_663, tax: 8_749, total: 50_412 });
    expect(saved.document.lineItems).toHaveLength(1);
    expect(saved.document.pricing.currency).toBe('EUR');
  });

  it('keeps the session cookie alive for as long as proposals are retained', async () => {
    const { response: created, proposal, cookie } = await create();
    const week = `Max-Age=${7 * 24 * 60 * 60}`;
    expect(created.headers.get('set-cookie')).toContain(week);

    const { response } = await patch(proposal, { version: 1, status: 'sent' }, cookie);
    expect(response.status).toBe(200);
    const renewed = response.headers.get('set-cookie');
    expect(renewed).toContain(week);
    expect(renewed?.split(';')[0]).toBe(cookie);
  });

  it('rejects a stale version with 409 instead of overwriting', async () => {
    const { proposal, cookie } = await create();
    await patch(
      proposal,
      { version: 1, document: { ...proposal.document, title: 'First tab' } },
      cookie,
    );
    const { response, body } = await patch(
      proposal,
      { version: 1, document: { ...proposal.document, title: 'Second tab' } },
      cookie,
    );
    expect(response.status).toBe(409);
    expect(ProblemSchema.parse(body).code).toBe('version_conflict');
  });

  it('enforces the status lifecycle and freezes sent proposals', async () => {
    const { proposal, cookie } = await create();
    expect(
      (await patch(proposal, { version: 1, status: 'accepted' }, cookie)).response.status,
    ).toBe(422);

    const sent = ProposalSchema.parse(
      (await patch(proposal, { version: 1, status: 'sent' }, cookie)).body,
    );
    expect(sent).toMatchObject({ status: 'sent', canEdit: false });

    const edit = await patch(sent, { version: sent.version, document: sent.document }, cookie);
    expect(edit.response.status).toBe(422);
    expect(ProblemSchema.parse(edit.body).errors?.[0]?.path).toBe('status');

    const accepted = ProposalSchema.parse(
      (await patch(sent, { version: sent.version, status: 'accepted' }, cookie)).body,
    );
    expect(accepted.status).toBe('accepted');
    expect(
      (await patch(accepted, { version: accepted.version, status: 'draft' }, cookie)).response
        .status,
    ).toBe(422);
  });

  it('validates the document and reports field paths', async () => {
    const { proposal, cookie } = await create();
    const document = {
      ...proposal.document,
      terms: {
        ...proposal.document.terms,
        milestones: [{ name: 'Deposit', due: '', percentBps: 4_000 }],
      },
    };
    const { response, body } = await patch(proposal, { version: 1, document }, cookie);
    expect(response.status).toBe(422);
    expect(ProblemSchema.parse(body).errors?.[0]?.path).toBe('document.terms.milestones');
  });

  it('keeps examples read-only and hides other visitors’ drafts', async () => {
    const example = (await list()).items[0]!;
    const { cookie } = await create();
    const full = ProposalSchema.parse(
      await (
        await getProposal(request(`/proposals/${example.id}`, { cookie }), params(example.id))
      ).json(),
    );
    expect(full.canEdit).toBe(false);
    expect(
      (await patch(full, { version: full.version, status: 'draft' }, cookie)).response.status,
    ).toBe(403);

    const { proposal } = await create();
    const stranger = await getProposal(
      request(`/proposals/${proposal.id}`, { cookie }),
      params(proposal.id),
    );
    expect(stranger.status).toBe(404);
  });
});

describe('GET /api/proposals', () => {
  it('lists examples with counts per status', async () => {
    const page = await list();
    expect(page.total).toBe(7);
    expect(page.counts).toEqual({ draft: 2, sent: 2, accepted: 2, declined: 1 });
    expect(page.items.every((item) => item.isExample)).toBe(true);
  });

  it('filters, searches, sorts and paginates', async () => {
    expect((await list('?status=accepted')).items.map((item) => item.status)).toEqual([
      'accepted',
      'accepted',
    ]);
    expect((await list('?q=brightwater')).items).toHaveLength(1);
    expect((await list('?q=PB-')).total).toBe(7);

    const sorted = (await list('?sort=total-desc')).items.map((item) => item.totalMinor);
    expect(sorted).toEqual([...sorted].sort((a, b) => b - a));

    const second = await list('?page=2&pageSize=5');
    expect(second.items).toHaveLength(2);
  });

  it('includes the visitor’s own proposals only for them', async () => {
    const { cookie } = await create('retainer');
    expect((await list('', cookie)).total).toBe(8);
    expect((await list()).total).toBe(7);
  });

  it('rejects invalid parameters', async () => {
    const response = await listProposals(request('/proposals?sort=random'), undefined);
    expect(response.status).toBe(422);
  });
});

describe('duplicate and delete', () => {
  it('duplicates an example into an editable draft', async () => {
    const example = (await list('?status=accepted')).items[0]!;
    const response = await duplicateProposal(
      request(`/proposals/${example.id}/duplicate`, { method: 'POST' }),
      params(example.id),
    );
    expect(response.status).toBe(201);
    const copy = ProposalSchema.parse(await response.json());
    expect(copy).toMatchObject({ status: 'draft', canEdit: true, isExample: false, version: 1 });
    expect(copy.document.title).toMatch(/^Copy of /);
    expect(copy.number).not.toBe(example.number);
  });

  it('deletes own proposals and refuses examples', async () => {
    const { proposal, cookie } = await create();
    const deleted = await deleteProposal(
      request(`/proposals/${proposal.id}`, { method: 'DELETE', cookie }),
      params(proposal.id),
    );
    expect(deleted.status).toBe(204);

    const example = (await list()).items[0]!;
    const refused = await deleteProposal(
      request(`/proposals/${example.id}`, { method: 'DELETE', cookie }),
      params(example.id),
    );
    expect(refused.status).toBe(403);
  });
});

describe('PDF export', () => {
  it('renders a PDF for a visible proposal and through its share token', async () => {
    const { proposal, cookie } = await create('mobile-app');
    const response = await getPdf(
      request(`/proposals/${proposal.id}/pdf`, { cookie }),
      params(proposal.id),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(response.headers.get('content-disposition')).toContain(`${proposal.number}.pdf`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(new TextDecoder().decode(bytes.subarray(0, 5))).toBe('%PDF-');
    const sent = renderer?.requests.at(-1);
    expect(sent?.proposal).toMatchObject({ number: proposal.number, totals: proposal.totals });
    expect(JSON.stringify(sent)).not.toContain(proposal.shareToken);

    const shared = await getSharedPdf(request(`/share/${proposal.shareToken}/pdf`), {
      params: Promise.resolve({ token: proposal.shareToken }),
    });
    expect(shared.status).toBe(200);
  });

  it('returns 404 for an unknown share token', async () => {
    const response = await getSharedPdf(
      request('/share/00000000-0000-4000-8000-000000000000/pdf'),
      {
        params: Promise.resolve({ token: '00000000-0000-4000-8000-000000000000' }),
      },
    );
    expect(response.status).toBe(404);
  });
});

describe('GET /api/openapi.json', () => {
  it('documents every operation with components from the Zod contracts', async () => {
    const document = await getOpenApi().json();
    expect(document.openapi).toBe('3.1.0');
    expect(Object.keys(document.paths)).toEqual([
      '/proposals',
      '/proposals/{id}',
      '/proposals/{id}/duplicate',
      '/proposals/{id}/pdf',
      '/share/{token}/pdf',
    ]);
    expect(Object.keys(document.components.schemas)).toEqual(
      expect.arrayContaining([
        'Proposal',
        'ProposalDocument',
        'Totals',
        'UpdateProposal',
        'Problem',
      ]),
    );
  });
});

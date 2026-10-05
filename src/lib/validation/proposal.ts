import { z } from 'zod';

import { CURRENCIES } from '@/domain/proposal/money';
import { PROPOSAL_STATUSES } from '@/domain/proposal/status';

/**
 * API contracts shared by the route handlers, the editor, the preview and the OpenAPI document.
 * Amounts are integer minor units (`…Minor`), rates and shares are basis points (`…Bps`).
 */

const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);
const isoDate = z.iso.date({ message: 'Use a valid date.' });

export const CurrencySchema = z.enum(CURRENCIES);
export const ProposalStatusSchema = z.enum(PROPOSAL_STATUSES);
export const DiscountTypeSchema = z.enum(['none', 'percent', 'fixed']);
export const LineUnitSchema = z.enum(['hour', 'day', 'week', 'unit', 'fixed']);
export type LineUnit = z.infer<typeof LineUnitSchema>;

export const BRAND_LOGOS = ['monogram', 'orbit', 'facet', 'stack'] as const;
export const BrandLogoSchema = z.enum(BRAND_LOGOS);
export type BrandLogo = z.infer<typeof BrandLogoSchema>;

export const ClientSchema = z
  .object({
    company: text(120).min(1, 'Enter the client company.'),
    contactName: text(120),
    email: z.union([z.literal(''), z.email('Enter a valid email address.').max(200)]),
    address: text(300),
    notes: text(1000),
  })
  .meta({ id: 'Client' });

export const ProjectSchema = z
  .object({
    name: text(160).min(1, 'Enter the project name.'),
    summary: text(2000),
    objectives: z
      .array(text(240).min(1, 'Remove empty objectives.'))
      .max(8, 'List at most 8 objectives.'),
    startDate: isoDate.nullable(),
    durationWeeks: z.int().min(1).max(260).nullable(),
  })
  .meta({ id: 'Project' });

export const ScopeItemSchema = z
  .object({
    name: text(160).min(1, 'Name this scope item.'),
    description: text(1000),
    included: z.boolean(),
    notes: text(500),
  })
  .meta({ id: 'ScopeItem' });

const hundredths = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

export const LineItemSchema = z
  .object({
    service: text(160).min(1, 'Name this service.'),
    description: text(500),
    unit: LineUnitSchema,
    quantity: z
      .number({ message: 'Enter a quantity.' })
      .min(0.01, 'Quantity must be at least 0.01.')
      .max(100_000)
      .refine(hundredths, 'Use at most two decimals.'),
    unitPriceMinor: z.int({ message: 'Enter a price.' }).min(0).max(1_000_000_000),
  })
  .meta({
    id: 'LineItem',
    description: 'unitPriceMinor is in minor units of the proposal currency.',
  });

export const PricingSchema = z
  .object({
    currency: CurrencySchema,
    discountType: DiscountTypeSchema,
    discountValue: z
      .int()
      .min(0)
      .max(1_000_000_000)
      .meta({ description: 'Basis points for percent, minor units for fixed.' }),
    taxRateBps: z.int().min(0).max(5_000),
    taxLabel: text(40),
  })
  .refine((pricing) => pricing.discountType !== 'percent' || pricing.discountValue <= 10_000, {
    message: 'A percentage discount cannot exceed 100%.',
    path: ['discountValue'],
  })
  .meta({ id: 'Pricing' });

export const MilestoneSchema = z
  .object({
    name: text(160).min(1, 'Name this milestone.'),
    due: text(80),
    percentBps: z.int().min(1).max(10_000),
  })
  .meta({ id: 'Milestone' });

export const TermsSchema = z
  .object({
    paymentTerms: text(300),
    validUntil: isoDate.nullable(),
    milestones: z.array(MilestoneSchema).max(12),
    notes: text(2000),
    conditions: text(4000),
  })
  .refine(
    (terms) =>
      terms.milestones.length === 0 ||
      terms.milestones.reduce((sum, item) => sum + item.percentBps, 0) === 10_000,
    { message: 'Milestone shares must add up to 100%.', path: ['milestones'] },
  )
  .meta({ id: 'Terms' });

export const BrandingSchema = z
  .object({
    companyName: text(120).min(1, 'Enter your company name.'),
    logo: BrandLogoSchema,
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex color such as #1c2a44.'),
    email: z.union([z.literal(''), z.email('Enter a valid email address.').max(200)]),
    phone: text(40),
    website: text(200),
    address: text(300),
  })
  .meta({ id: 'Branding' });

export const ProposalDocumentSchema = z
  .object({
    title: text(160).min(1, 'Give the proposal a title.'),
    client: ClientSchema,
    project: ProjectSchema,
    scope: z.array(ScopeItemSchema).max(40),
    lineItems: z.array(LineItemSchema).max(40),
    pricing: PricingSchema,
    terms: TermsSchema,
    branding: BrandingSchema,
  })
  .meta({ id: 'ProposalDocument', description: 'Everything a person edits in a proposal.' });
export type ProposalDocument = z.infer<typeof ProposalDocumentSchema>;

export const TotalsSchema = z
  .object({
    lines: z.array(z.int()),
    subtotal: z.int(),
    discount: z.int(),
    taxable: z.int(),
    tax: z.int(),
    total: z.int(),
    milestones: z
      .array(z.int())
      .meta({ description: 'Amount of each milestone; they add up to the total.' }),
  })
  .meta({
    id: 'Totals',
    description: 'Computed on the server with the same function the editor uses. Minor units.',
  });
export type ProposalTotals = z.infer<typeof TotalsSchema>;

export const ProposalSchema = z
  .object({
    id: z.uuid(),
    number: z.string().meta({ example: 'PB-2026-0042' }),
    status: ProposalStatusSchema,
    version: z.int().min(1).meta({
      description: 'Send it back with every PATCH; a stale version is rejected with 409.',
    }),
    isExample: z.boolean(),
    canEdit: z.boolean().meta({ description: 'True for your own drafts.' }),
    shareToken: z.string(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    document: ProposalDocumentSchema,
    totals: TotalsSchema,
  })
  .meta({ id: 'Proposal' });
export type Proposal = z.infer<typeof ProposalSchema>;

export const ProposalSummarySchema = z
  .object({
    id: z.uuid(),
    number: z.string(),
    title: z.string(),
    clientCompany: z.string(),
    status: ProposalStatusSchema,
    currency: CurrencySchema,
    totalMinor: z.int(),
    validUntil: isoDate.nullable(),
    isExample: z.boolean(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: 'ProposalSummary' });
export type ProposalSummary = z.infer<typeof ProposalSummarySchema>;

export const ProposalListSchema = z
  .object({
    items: z.array(ProposalSummarySchema),
    page: z.int().min(1),
    pageSize: z.int().min(1),
    total: z.int().min(0),
    counts: z
      .record(ProposalStatusSchema, z.int().min(0))
      .meta({ description: 'Visible proposals per status, ignoring the status filter.' }),
  })
  .meta({ id: 'ProposalList' });
export type ProposalList = z.infer<typeof ProposalListSchema>;

export const PROPOSAL_SORTS = [
  'updated-desc',
  'updated-asc',
  'total-desc',
  'total-asc',
  'number-desc',
] as const;

export const ListProposalsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  status: ProposalStatusSchema.optional(),
  q: z.string().trim().max(80).optional(),
  sort: z.enum(PROPOSAL_SORTS).default('updated-desc'),
});
export type ListProposalsQuery = z.infer<typeof ListProposalsQuerySchema>;

export const TEMPLATES = ['web-app', 'mobile-app', 'retainer', 'blank'] as const;
export const TemplateSchema = z.enum(TEMPLATES);
export type Template = z.infer<typeof TemplateSchema>;

export const CreateProposalSchema = z
  .object({ template: TemplateSchema.default('web-app') })
  .meta({ id: 'CreateProposal' });

export const UpdateProposalSchema = z
  .object({
    version: z.int().min(1),
    status: ProposalStatusSchema.optional(),
    document: ProposalDocumentSchema.optional(),
  })
  .refine((body) => body.status !== undefined || body.document !== undefined, {
    message: 'Send a document, a status or both.',
  })
  .meta({
    id: 'UpdateProposal',
    description: 'Autosave sends the whole document with the version it was based on.',
  });
export type UpdateProposal = z.infer<typeof UpdateProposalSchema>;

/** RFC 9457 problem details, the body of every error response. */
export const ProblemSchema = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.int(),
    detail: z.string().optional(),
    code: z.string(),
    errors: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  })
  .meta({ id: 'Problem' });
export type Problem = z.infer<typeof ProblemSchema>;

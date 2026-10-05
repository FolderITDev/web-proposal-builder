import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSequence,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { CURRENCIES } from '@/domain/proposal/money';
import { PROPOSAL_STATUSES } from '@/domain/proposal/status';
import { BRAND_LOGOS } from '@/lib/validation/proposal';

export const proposalStatus = pgEnum('proposal_status', PROPOSAL_STATUSES);
export const currency = pgEnum('currency', CURRENCIES);
export const discountType = pgEnum('discount_type', ['none', 'percent', 'fixed']);
export const lineUnit = pgEnum('line_unit', ['hour', 'day', 'week', 'unit', 'fixed']);
export const brandLogo = pgEnum('brand_logo', BRAND_LOGOS);

/** Feeds the human-readable proposal number, PB-<year>-<sequence>. */
export const proposalNumberSequence = pgSequence('proposal_number_seq', { startWith: 1 });

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

/**
 * One row per proposal: the document's single-valued sections as columns, its lists as child
 * tables. `total_minor` is derived on every save so lists can sort and sum without recomputing.
 */
export const proposals = pgTable(
  'proposals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    number: text('number').notNull(),
    /** SHA-256 of the visitor's anonymous session token. Null for examples. */
    ownerHash: text('owner_hash'),
    isExample: boolean('is_example').notNull().default(false),
    shareToken: uuid('share_token').notNull().defaultRandom(),
    status: proposalStatus('status').notNull().default('draft'),
    version: integer('version').notNull().default(1),
    title: text('title').notNull(),

    clientCompany: text('client_company').notNull(),
    clientContactName: text('client_contact_name').notNull().default(''),
    clientEmail: text('client_email').notNull().default(''),
    clientAddress: text('client_address').notNull().default(''),
    clientNotes: text('client_notes').notNull().default(''),

    projectName: text('project_name').notNull(),
    projectSummary: text('project_summary').notNull().default(''),
    projectObjectives: jsonb('project_objectives').$type<string[]>().notNull().default([]),
    startDate: date('start_date', { mode: 'string' }),
    durationWeeks: smallint('duration_weeks'),

    currency: currency('currency').notNull().default('USD'),
    discountType: discountType('discount_type').notNull().default('none'),
    discountValue: bigint('discount_value', { mode: 'number' }).notNull().default(0),
    taxRateBps: integer('tax_rate_bps').notNull().default(0),
    taxLabel: text('tax_label').notNull().default('Tax'),
    totalMinor: bigint('total_minor', { mode: 'number' }).notNull().default(0),

    paymentTerms: text('payment_terms').notNull().default(''),
    validUntil: date('valid_until', { mode: 'string' }),
    notes: text('notes').notNull().default(''),
    conditions: text('conditions').notNull().default(''),

    brandCompanyName: text('brand_company_name').notNull(),
    brandLogo: brandLogo('brand_logo').notNull().default('monogram'),
    brandColor: text('brand_color').notNull().default('#1c2a44'),
    brandEmail: text('brand_email').notNull().default(''),
    brandPhone: text('brand_phone').notNull().default(''),
    brandWebsite: text('brand_website').notNull().default(''),
    brandAddress: text('brand_address').notNull().default(''),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('proposals_number_idx').on(table.number),
    uniqueIndex('proposals_share_token_idx').on(table.shareToken),
    index('proposals_owner_updated_idx').on(table.ownerHash, table.updatedAt.desc()),
    index('proposals_example_updated_idx').on(table.isExample, table.updatedAt.desc()),
    check(
      'proposals_owner_or_example',
      sql`(${table.isExample} AND ${table.ownerHash} IS NULL) OR (NOT ${table.isExample} AND ${table.ownerHash} IS NOT NULL)`,
    ),
    check('proposals_tax_rate', sql`${table.taxRateBps} BETWEEN 0 AND 5000`),
    check('proposals_brand_color', sql`${table.brandColor} ~ '^#[0-9a-fA-F]{6}$'`),
  ],
);

const child = {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id')
    .notNull()
    .references(() => proposals.id, { onDelete: 'cascade' }),
  position: smallint('position').notNull(),
};

export const scopeItems = pgTable(
  'proposal_scope_items',
  {
    ...child,
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    included: boolean('included').notNull().default(true),
    notes: text('notes').notNull().default(''),
  },
  (table) => [uniqueIndex('scope_items_position_idx').on(table.proposalId, table.position)],
);

export const lineItems = pgTable(
  'proposal_line_items',
  {
    ...child,
    service: text('service').notNull(),
    description: text('description').notNull().default(''),
    unit: lineUnit('unit').notNull(),
    quantityHundredths: integer('quantity_hundredths').notNull(),
    unitPriceMinor: bigint('unit_price_minor', { mode: 'number' }).notNull(),
  },
  (table) => [
    uniqueIndex('line_items_position_idx').on(table.proposalId, table.position),
    check('line_items_quantity', sql`${table.quantityHundredths} > 0`),
    check('line_items_price', sql`${table.unitPriceMinor} >= 0`),
  ],
);

export const milestones = pgTable(
  'proposal_milestones',
  {
    ...child,
    name: text('name').notNull(),
    due: text('due').notNull().default(''),
    percentBps: integer('percent_bps').notNull(),
  },
  (table) => [
    uniqueIndex('milestones_position_idx').on(table.proposalId, table.position),
    check('milestones_percent', sql`${table.percentBps} BETWEEN 1 AND 10000`),
  ],
);

export const proposalRelations = relations(proposals, ({ many }) => ({
  scopeItems: many(scopeItems),
  lineItems: many(lineItems),
  milestones: many(milestones),
}));
export const scopeItemRelations = relations(scopeItems, ({ one }) => ({
  proposal: one(proposals, { fields: [scopeItems.proposalId], references: [proposals.id] }),
}));
export const lineItemRelations = relations(lineItems, ({ one }) => ({
  proposal: one(proposals, { fields: [lineItems.proposalId], references: [proposals.id] }),
}));
export const milestoneRelations = relations(milestones, ({ one }) => ({
  proposal: one(proposals, { fields: [milestones.proposalId], references: [proposals.id] }),
}));

export type ProposalRow = typeof proposals.$inferSelect;
export type NewProposalRow = typeof proposals.$inferInsert;
export type ProposalWithChildren = ProposalRow & {
  scopeItems: (typeof scopeItems.$inferSelect)[];
  lineItems: (typeof lineItems.$inferSelect)[];
  milestones: (typeof milestones.$inferSelect)[];
};

import { toHundredths } from '@/domain/proposal/document';
import { type ProposalDocument } from '@/lib/validation/proposal';

import { type NewProposalRow, type ProposalWithChildren } from '../db/schema';

type DocumentColumns = Omit<
  NewProposalRow,
  'number' | 'ownerHash' | 'isExample' | 'status' | 'version' | 'totalMinor'
>;

/** The single-valued sections of a document, as proposal columns. */
export function documentColumns(document: ProposalDocument): DocumentColumns {
  const { client, project, pricing, terms, branding } = document;
  return {
    title: document.title,
    clientCompany: client.company,
    clientContactName: client.contactName,
    clientEmail: client.email,
    clientAddress: client.address,
    clientNotes: client.notes,
    projectName: project.name,
    projectSummary: project.summary,
    projectObjectives: project.objectives,
    startDate: project.startDate,
    durationWeeks: project.durationWeeks,
    currency: pricing.currency,
    discountType: pricing.discountType,
    discountValue: pricing.discountValue,
    taxRateBps: pricing.taxRateBps,
    taxLabel: pricing.taxLabel,
    paymentTerms: terms.paymentTerms,
    validUntil: terms.validUntil,
    notes: terms.notes,
    conditions: terms.conditions,
    brandCompanyName: branding.companyName,
    brandLogo: branding.logo,
    brandColor: branding.color,
    brandEmail: branding.email,
    brandPhone: branding.phone,
    brandWebsite: branding.website,
    brandAddress: branding.address,
  };
}

/** The list sections of a document, as child rows in order. */
export function documentChildren(proposalId: string, document: ProposalDocument) {
  return {
    scopeItems: document.scope.map((item, position) => ({ proposalId, position, ...item })),
    lineItems: document.lineItems.map((item, position) => ({
      proposalId,
      position,
      service: item.service,
      description: item.description,
      unit: item.unit,
      quantityHundredths: toHundredths(item.quantity),
      unitPriceMinor: item.unitPriceMinor,
    })),
    milestones: document.terms.milestones.map((item, position) => ({
      proposalId,
      position,
      ...item,
    })),
  };
}

const byPosition = <T extends { position: number }>(rows: readonly T[]) =>
  [...rows].sort((a, b) => a.position - b.position);

/** Rebuilds the editable document from a proposal row and its children. */
export function rowToDocument(row: ProposalWithChildren): ProposalDocument {
  return {
    title: row.title,
    client: {
      company: row.clientCompany,
      contactName: row.clientContactName,
      email: row.clientEmail,
      address: row.clientAddress,
      notes: row.clientNotes,
    },
    project: {
      name: row.projectName,
      summary: row.projectSummary,
      objectives: row.projectObjectives,
      startDate: row.startDate,
      durationWeeks: row.durationWeeks,
    },
    scope: byPosition(row.scopeItems).map(({ name, description, included, notes }) => ({
      name,
      description,
      included,
      notes,
    })),
    lineItems: byPosition(row.lineItems).map((item) => ({
      service: item.service,
      description: item.description,
      unit: item.unit,
      quantity: item.quantityHundredths / 100,
      unitPriceMinor: item.unitPriceMinor,
    })),
    pricing: {
      currency: row.currency,
      discountType: row.discountType,
      discountValue: row.discountValue,
      taxRateBps: row.taxRateBps,
      taxLabel: row.taxLabel,
    },
    terms: {
      paymentTerms: row.paymentTerms,
      validUntil: row.validUntil,
      milestones: byPosition(row.milestones).map(({ name, due, percentBps }) => ({
        name,
        due,
        percentBps,
      })),
      notes: row.notes,
      conditions: row.conditions,
    },
    branding: {
      companyName: row.brandCompanyName,
      logo: row.brandLogo,
      color: row.brandColor,
      email: row.brandEmail,
      phone: row.brandPhone,
      website: row.brandWebsite,
      address: row.brandAddress,
    },
  };
}

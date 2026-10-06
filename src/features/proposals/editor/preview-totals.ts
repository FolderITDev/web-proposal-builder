import { documentTotals } from '@/domain/proposal/document';
import { type ProposalDocument, type ProposalTotals } from '@/lib/validation/proposal';

const finite = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;

/**
 * Totals for the live preview while the person is typing. Half-typed numbers count as zero, so
 * the preview never shows NaN; the saved totals always come from the validated document.
 */
export function previewTotals(document: ProposalDocument): ProposalTotals {
  return documentTotals({
    lineItems: document.lineItems.map((item) => ({
      ...item,
      quantity: finite(item.quantity),
      unitPriceMinor: Math.round(finite(item.unitPriceMinor)),
    })),
    pricing: {
      ...document.pricing,
      discountValue: Math.round(finite(document.pricing.discountValue)),
      taxRateBps: Math.round(finite(document.pricing.taxRateBps)),
    },
    terms: {
      ...document.terms,
      milestones: document.terms.milestones.map((milestone) => ({
        ...milestone,
        percentBps: Math.round(finite(milestone.percentBps)),
      })),
    },
  });
}

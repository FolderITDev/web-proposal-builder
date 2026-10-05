import { type ProposalDocument, type ProposalTotals } from '@/lib/validation/proposal';

import { computeTotals, type PricedLine, splitByBasisPoints } from './totals';

/** Quantities travel as decimals with at most two places; math runs on integer hundredths. */
export function toHundredths(quantity: number): number {
  return Math.round(quantity * 100);
}

export function pricedLines(lineItems: ProposalDocument['lineItems']): PricedLine[] {
  return lineItems.map((item) => ({
    quantityHundredths: toHundredths(item.quantity),
    unitPriceMinor: item.unitPriceMinor,
  }));
}

/** Totals for a whole document, including the amount due at each milestone. */
export function documentTotals(
  document: Pick<ProposalDocument, 'lineItems' | 'pricing' | 'terms'>,
): ProposalTotals {
  const totals = computeTotals(pricedLines(document.lineItems), document.pricing);
  const milestones = splitByBasisPoints(
    totals.total,
    document.terms.milestones.map((milestone) => milestone.percentBps),
  );
  return { ...totals, milestones };
}

/** Adds days to a YYYY-MM-DD date, in UTC so the result never depends on the server's zone. */
export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

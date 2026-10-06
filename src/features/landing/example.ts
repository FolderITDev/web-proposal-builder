import { EXAMPLE_PROPOSALS } from '@/content/example-proposals';
import { documentTotals } from '@/domain/proposal/document';
import { formatMoney } from '@/domain/proposal/money';
import { computeTotals, formatBasisPoints, splitByBasisPoints } from '@/domain/proposal/totals';
import { type DialSegment } from '@/components/dial/sub-dial';

const example = EXAMPLE_PROPOSALS[0];
if (!example) throw new Error('The landing page needs at least one example proposal.');

/** An example proposal and its totals, computed at build time by the pricing functions. */
export const EXAMPLE = {
  document: example.document,
  totals: documentTotals(example.document),
  number: 'PB-2026-0001',
};

export const EXAMPLE_DIAL: DialSegment[] = example.document.terms.milestones.map(
  (milestone, index) => ({
    label: milestone.name,
    detail: `${formatBasisPoints(milestone.percentBps)} · ${formatMoney(EXAMPLE.totals.milestones[index] ?? 0, example.document.pricing.currency)}`,
    share: milestone.percentBps / 10_000,
  }),
);

/** The worked example shown in the pricing section, computed live from the domain functions. */
const EXAMPLE_LINES = [
  { label: 'Design, 12.5 h at EUR 33.33', quantityHundredths: 1_250, unitPriceMinor: 3_333 },
  { label: 'Development, 80 h at EUR 45.00', quantityHundredths: 8_000, unitPriceMinor: 4_500 },
  { label: 'Hosting setup, fixed', quantityHundredths: 100, unitPriceMinor: 19_999 },
];
const exampleTotals = computeTotals(EXAMPLE_LINES, {
  discountType: 'percent',
  discountValue: 1_000,
  taxRateBps: 2_100,
});
const exampleSplit = splitByBasisPoints(exampleTotals.total, [3_333, 3_333, 3_334]);

export const WORKED_EXAMPLE = {
  lines: EXAMPLE_LINES.map((line, index) => ({
    label: line.label,
    amount: formatMoney(exampleTotals.lines[index] ?? 0, 'EUR'),
  })),
  subtotal: formatMoney(exampleTotals.subtotal, 'EUR'),
  discount: formatMoney(exampleTotals.discount, 'EUR'),
  tax: formatMoney(exampleTotals.tax, 'EUR'),
  total: formatMoney(exampleTotals.total, 'EUR'),
  split: exampleSplit.map((amount, index) => ({
    share: formatBasisPoints([3_333, 3_333, 3_334][index] ?? 0),
    amount: formatMoney(amount, 'EUR'),
  })),
  splitSum: formatMoney(
    exampleSplit.reduce((sum, value) => sum + value, 0),
    'EUR',
  ),
};

export type DiscountType = 'none' | 'percent' | 'fixed';

export type PricedLine = {
  /** Quantity in hundredths: 1250 is 12.5 hours. */
  quantityHundredths: number;
  unitPriceMinor: number;
};

export type PricingRules = {
  discountType: DiscountType;
  /** Basis points for percent (1000 = 10%), minor units for fixed. */
  discountValue: number;
  /** Basis points: 2100 = 21%. */
  taxRateBps: number;
};

export type Totals = {
  lines: number[];
  subtotal: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
};

/** Rounds half away from zero; inputs here are never negative, so this is half up. */
function roundHalfUp(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

/** One line: quantity × unit price, rounded once to the cent. */
export function lineTotal({ quantityHundredths, unitPriceMinor }: PricedLine): number {
  return roundHalfUp((quantityHundredths * unitPriceMinor) / 100);
}

/**
 * The single pricing function used by the editor, the preview, the API, the share page and the
 * PDF. Order of operations: line totals, subtotal, discount (capped at the subtotal), tax on
 * the discounted amount, total. Each step rounds to the cent exactly once.
 */
export function computeTotals(lines: readonly PricedLine[], rules: PricingRules): Totals {
  const lineTotals = lines.map(lineTotal);
  const subtotal = lineTotals.reduce((sum, value) => sum + value, 0);

  const rawDiscount =
    rules.discountType === 'percent'
      ? roundHalfUp((subtotal * rules.discountValue) / 10_000)
      : rules.discountType === 'fixed'
        ? rules.discountValue
        : 0;
  const discount = Math.min(Math.max(0, rawDiscount), subtotal);

  const taxable = subtotal - discount;
  const tax = roundHalfUp((taxable * rules.taxRateBps) / 10_000);
  return { lines: lineTotals, subtotal, discount, taxable, tax, total: taxable + tax };
}

/**
 * Splits a total across milestones by basis points without losing a cent: each share is
 * floored, and the remaining cents go to the shares with the largest remainders (ties to the
 * earliest milestone).
 */
export function splitByBasisPoints(total: number, weightsBps: readonly number[]): number[] {
  const exact = weightsBps.map((bps) => (total * bps) / 10_000);
  const floors = exact.map(Math.floor);
  let remaining = total - floors.reduce((sum, value) => sum + value, 0);
  const order = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const { index } of order) {
    if (remaining <= 0) break;
    floors[index] = (floors[index] ?? 0) + 1;
    remaining -= 1;
  }
  return floors;
}

/** Formats basis points for people: 1250 → "12.5%". */
export function formatBasisPoints(bps: number): string {
  return `${(bps / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;
}

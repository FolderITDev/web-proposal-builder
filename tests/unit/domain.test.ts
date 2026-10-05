import { describe, expect, it } from 'vitest';

import { addDays, documentTotals, toHundredths } from '@/domain/proposal/document';
import { formatMoney, parseMoney, toDecimalString } from '@/domain/proposal/money';
import {
  allowedTransitions,
  canTransition,
  formatProposalNumber,
  isEditable,
  isExpired,
} from '@/domain/proposal/status';
import { documentFromTemplate } from '@/domain/proposal/templates';
import {
  computeTotals,
  formatBasisPoints,
  lineTotal,
  splitByBasisPoints,
} from '@/domain/proposal/totals';
import { ProposalDocumentSchema, TEMPLATES } from '@/lib/validation/proposal';

describe('money', () => {
  it('formats with the currency code, never an ambiguous symbol', () => {
    expect(formatMoney(120_050, 'USD')).toBe('USD 1,200.50');
    expect(formatMoney(99, 'EUR')).toBe('EUR 0.99');
    expect(formatMoney(1_234_567, 'ARS', { compact: true })).toBe('ARS 12,346');
  });

  it('parses user input into minor units', () => {
    expect(parseMoney('1,200.5')).toBe(120_050);
    expect(parseMoney('0.07')).toBe(7);
    expect(parseMoney(' 42 ')).toBe(4_200);
    expect(parseMoney('1.234')).toBeNull();
    expect(parseMoney('-5')).toBeNull();
    expect(parseMoney('abc')).toBeNull();
  });

  it('round-trips to an editable decimal string', () => {
    expect(toDecimalString(120_050)).toBe('1200.50');
    expect(parseMoney(toDecimalString(7))).toBe(7);
  });
});

describe('totals', () => {
  it('multiplies fractional quantities and rounds each line once', () => {
    expect(lineTotal({ quantityHundredths: 1_250, unitPriceMinor: 3_333 })).toBe(41_663);
    expect(toHundredths(0.1 + 0.2)).toBe(30);
  });

  it('matches the brief example: 40 h, 180 h and 30 h at USD 30', () => {
    const totals = computeTotals(
      [
        { quantityHundredths: 4_000, unitPriceMinor: 3_000 },
        { quantityHundredths: 18_000, unitPriceMinor: 3_000 },
        { quantityHundredths: 3_000, unitPriceMinor: 3_000 },
      ],
      { discountType: 'none', discountValue: 0, taxRateBps: 0 },
    );
    expect(totals.lines).toEqual([120_000, 540_000, 90_000]);
    expect(totals.total).toBe(750_000);
  });

  it('applies a percentage discount, then tax on the discounted amount', () => {
    const totals = computeTotals([{ quantityHundredths: 100, unitPriceMinor: 100_000 }], {
      discountType: 'percent',
      discountValue: 1_000,
      taxRateBps: 2_100,
    });
    expect(totals).toMatchObject({
      subtotal: 100_000,
      discount: 10_000,
      taxable: 90_000,
      tax: 18_900,
      total: 108_900,
    });
  });

  it('caps a fixed discount at the subtotal', () => {
    const totals = computeTotals([{ quantityHundredths: 100, unitPriceMinor: 5_000 }], {
      discountType: 'fixed',
      discountValue: 9_000,
      taxRateBps: 1_000,
    });
    expect(totals).toMatchObject({ discount: 5_000, taxable: 0, tax: 0, total: 0 });
  });

  it('rounds half up on tax', () => {
    const totals = computeTotals([{ quantityHundredths: 100, unitPriceMinor: 5 }], {
      discountType: 'none',
      discountValue: 0,
      taxRateBps: 1_000,
    });
    expect(totals.tax).toBe(1);
  });

  it('handles an empty proposal', () => {
    expect(
      computeTotals([], { discountType: 'percent', discountValue: 5_000, taxRateBps: 2_000 }).total,
    ).toBe(0);
  });

  it('formats basis points', () => {
    expect(formatBasisPoints(1_250)).toBe('12.5%');
    expect(formatBasisPoints(10_000)).toBe('100%');
  });
});

describe('splitByBasisPoints', () => {
  it('never loses or invents a cent', () => {
    for (const total of [0, 1, 99, 100_001, 750_000, 1_234_567]) {
      const parts = splitByBasisPoints(total, [3_333, 3_333, 3_334]);
      expect(parts.reduce((sum, part) => sum + part, 0)).toBe(total);
    }
  });

  it('gives remaining cents to the largest remainders, ties to the earliest', () => {
    expect(splitByBasisPoints(100, [3_333, 3_333, 3_334])).toEqual([33, 33, 34]);
    expect(splitByBasisPoints(2, [5_000, 5_000])).toEqual([1, 1]);
    expect(splitByBasisPoints(1, [5_000, 5_000])).toEqual([1, 0]);
  });

  it('returns no parts without milestones', () => {
    expect(splitByBasisPoints(500, [])).toEqual([]);
  });
});

describe('status', () => {
  it('follows the draft → sent → answered lifecycle', () => {
    expect(canTransition('draft', 'sent')).toBe(true);
    expect(canTransition('draft', 'accepted')).toBe(false);
    expect(canTransition('sent', 'accepted')).toBe(true);
    expect(canTransition('sent', 'draft')).toBe(true);
    expect(allowedTransitions('accepted')).toEqual([]);
    expect(canTransition('declined', 'draft')).toBe(true);
    expect(canTransition('accepted', 'accepted')).toBe(true);
  });

  it('only allows editing drafts', () => {
    expect(isEditable('draft')).toBe(true);
    expect(isEditable('sent')).toBe(false);
  });

  it('expires after the validity date', () => {
    expect(isExpired('2026-10-05', '2026-10-06')).toBe(true);
    expect(isExpired('2026-10-06', '2026-10-06')).toBe(false);
    expect(isExpired(null, '2026-10-06')).toBe(false);
  });

  it('formats proposal numbers', () => {
    expect(formatProposalNumber(2026, 42)).toBe('PB-2026-0042');
  });
});

describe('templates', () => {
  it.each(TEMPLATES)('the %s template is a valid document', (template) => {
    const document = documentFromTemplate(template, '2026-10-06');
    expect(() => ProposalDocumentSchema.parse(document)).not.toThrow();
    expect(document.terms.validUntil).toBe('2026-11-05');
  });

  it('templates are independent copies', () => {
    const first = documentFromTemplate('web-app', '2026-10-06');
    first.scope[0]!.name = 'Changed';
    expect(documentFromTemplate('web-app', '2026-10-06').scope[0]!.name).toBe('Authentication');
  });

  it('computes milestone amounts that add up to the total', () => {
    const totals = documentTotals(documentFromTemplate('mobile-app', '2026-10-06'));
    expect(totals.milestones.reduce((sum, value) => sum + value, 0)).toBe(totals.total);
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-20', 30)).toBe('2027-01-19');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('document validation', () => {
  const valid = documentFromTemplate('web-app', '2026-10-06');

  it('rejects milestones that do not add up to 100%', () => {
    const result = ProposalDocumentSchema.safeParse({
      ...valid,
      terms: { ...valid.terms, milestones: [{ name: 'Deposit', due: '', percentBps: 5_000 }] },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['terms', 'milestones']);
  });

  it('rejects quantities with more than two decimals and percentage discounts over 100%', () => {
    const lines = ProposalDocumentSchema.safeParse({
      ...valid,
      lineItems: [{ ...valid.lineItems[0]!, quantity: 1.005 }],
    });
    expect(lines.success).toBe(false);
    const discount = ProposalDocumentSchema.safeParse({
      ...valid,
      pricing: { ...valid.pricing, discountType: 'percent', discountValue: 12_000 },
    });
    expect(discount.success).toBe(false);
  });
});

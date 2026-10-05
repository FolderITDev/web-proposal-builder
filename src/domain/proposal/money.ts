/**
 * Money is always an integer number of minor units (cents). Every supported currency has two
 * minor digits, so 1234 means 12.34 in any of them. Floating point never touches an amount.
 */
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'MXN', 'BRL', 'ARS'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_LABEL: Record<Currency, string> = {
  USD: 'US dollar',
  EUR: 'Euro',
  GBP: 'British pound',
  CAD: 'Canadian dollar',
  AUD: 'Australian dollar',
  MXN: 'Mexican peso',
  BRL: 'Brazilian real',
  ARS: 'Argentine peso',
};

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: Currency, compact: boolean): Intl.NumberFormat {
  const key = `${currency}:${compact}`;
  let value = formatters.get(key);
  if (!value) {
    value = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'code',
      minimumFractionDigits: compact ? 0 : 2,
      maximumFractionDigits: compact ? 0 : 2,
    });
    formatters.set(key, value);
  }
  return value;
}

/** "USD 12,345.60". The code avoids ambiguous symbols ($ is used by five of these currencies). */
export function formatMoney(minor: number, currency: Currency, { compact = false } = {}): string {
  const major = compact ? Math.round(minor / 100) : minor / 100;
  return formatter(currency, compact).format(major).replace(/ /g, ' ');
}

/** Parses user input such as "1,200.5" or "1200" into minor units. Returns null when invalid. */
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[\s,]/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [whole = '0', fraction = ''] = cleaned.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

/** Minor units to an editable decimal string: 120050 → "1200.50". */
export function toDecimalString(minor: number): string {
  return (minor / 100).toFixed(2);
}

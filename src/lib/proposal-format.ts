import { type LineUnit } from '@/lib/validation/proposal';

const UNIT: Record<LineUnit, [string, string]> = {
  hour: ['h', 'h'],
  day: ['day', 'days'],
  week: ['week', 'weeks'],
  unit: ['unit', 'units'],
  fixed: ['fixed', 'fixed'],
};

export const UNIT_LABEL: Record<LineUnit, string> = {
  hour: 'Hours',
  day: 'Days',
  week: 'Weeks',
  unit: 'Units',
  fixed: 'Fixed fee',
};

/** "40 h", "12.5 days", "Fixed fee". Shared by the preview, the share page and the PDF. */
export function formatQuantity(quantity: number, unit: LineUnit): string {
  if (unit === 'fixed') return 'Fixed fee';
  const [one, many] = UNIT[unit];
  const value = quantity.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return `${value} ${quantity === 1 ? one : many}`;
}

const documentDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' });

/** A YYYY-MM-DD date as written in a document: "November 5, 2026". */
export function formatDocumentDate(isoDate: string): string {
  return documentDate.format(new Date(`${isoDate}T00:00:00Z`));
}

const relative = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

/** "just now", "3 minutes ago", "yesterday". */
export function formatRelative(iso: string, now = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  if (Math.abs(seconds) < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return relative.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relative.format(hours, 'hour');
  return relative.format(Math.round(hours / 24), 'day');
}

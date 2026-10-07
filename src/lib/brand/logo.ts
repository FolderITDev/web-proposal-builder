import { type BrandLogo } from '@/lib/validation/proposal';

/**
 * Brand marks, described once as primitives in a 40 × 40 box. The preview draws them, and the
 * document renderer receives the same logo choice with the proposal.
 */
export type LogoShape =
  | { kind: 'circle'; cx: number; cy: number; r: number; fill?: boolean; strokeWidth?: number }
  | { kind: 'rect'; x: number; y: number; width: number; height: number; opacity?: number }
  | { kind: 'polygon'; points: string; fill?: boolean; strokeWidth?: number }
  | { kind: 'text'; x: number; y: number; value: string; size: number };

export const LOGO_LABEL: Record<BrandLogo, string> = {
  monogram: 'Monogram',
  orbit: 'Orbit',
  facet: 'Facet',
  stack: 'Stack',
};

export function initials(companyName: string): string {
  const words = companyName
    .replace(/[^\p{L}\p{N}\s&]/gu, '')
    .split(/\s+/)
    .filter((word) => /^\p{L}/u.test(word));
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '·';
}

export function logoShapes(logo: BrandLogo, companyName: string): LogoShape[] {
  switch (logo) {
    case 'monogram':
      return [
        { kind: 'circle', cx: 20, cy: 20, r: 19, fill: true },
        { kind: 'text', x: 20, y: 25, value: initials(companyName), size: 14 },
      ];
    case 'orbit':
      return [
        { kind: 'circle', cx: 20, cy: 20, r: 17, strokeWidth: 2.5 },
        { kind: 'circle', cx: 20, cy: 20, r: 7, fill: true },
        { kind: 'circle', cx: 32, cy: 8.5, r: 3.5, fill: true },
      ];
    case 'facet':
      return [
        { kind: 'polygon', points: '20,2 38,20 20,38 2,20', fill: true },
        { kind: 'polygon', points: '20,10 30,20 20,30 10,20', strokeWidth: 0 },
      ];
    case 'stack':
      return [
        { kind: 'rect', x: 2, y: 4, width: 36, height: 8 },
        { kind: 'rect', x: 8, y: 16, width: 30, height: 8, opacity: 0.7 },
        { kind: 'rect', x: 14, y: 28, width: 24, height: 8, opacity: 0.45 },
      ];
  }
}

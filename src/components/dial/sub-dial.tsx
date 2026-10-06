import { type CSSProperties } from 'react';

import { cn } from '@/lib/cn';

export type DialSegment = { label: string; detail: string; share: number };

type SubDialProps = {
  /** Segments around the dial; shares are fractions that should add up to 1. */
  segments: readonly DialSegment[];
  centerLabel: string;
  centerValue: string;
  caption: string;
  size?: number;
  className?: string;
};

const TICKS = 100;
const GAP = 0.6;
const TONES = [1, 0.72, 0.5, 0.34, 0.22];
const round = (value: number) => Math.round(value * 100) / 100;

/**
 * A chronograph-style sub-dial: a hundred applied indices, the segments on an inner track and
 * the total at the center. Segments are dashes on circles with a path length of 100, so a
 * change of share animates as a CSS transition of the dash, not a redraw.
 */
export function SubDial({
  segments,
  centerLabel,
  centerValue,
  caption,
  size = 260,
  className,
}: SubDialProps) {
  const arcs = segments.map((segment, index) => ({
    ...segment,
    start: segments.slice(0, index).reduce((sum, previous) => sum + previous.share * 100, 0),
    length: Math.max(0, segment.share * 100 - (segments.length > 1 ? GAP : 0)),
    tone: TONES[index % TONES.length] ?? 0.22,
  }));

  return (
    <figure className={cn('flex flex-col items-center gap-4', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 200 200" className="size-full" aria-hidden>
          <circle cx="100" cy="100" r="97" fill="var(--color-raised)" stroke="var(--color-rule)" />
          <circle
            cx="100"
            cy="100"
            r="89"
            fill="none"
            stroke="var(--color-rule)"
            strokeWidth="0.5"
          />
          {Array.from({ length: TICKS }, (_, tick) => {
            const major = tick % 10 === 0;
            const angle = (tick / TICKS) * Math.PI * 2 - Math.PI / 2;
            const outer = 95;
            const inner = major ? 87 : 91.5;
            return (
              <line
                key={tick}
                x1={round(100 + outer * Math.cos(angle))}
                y1={round(100 + outer * Math.sin(angle))}
                x2={round(100 + inner * Math.cos(angle))}
                y2={round(100 + inner * Math.sin(angle))}
                stroke={major ? 'var(--color-ink)' : 'var(--color-steel)'}
                strokeWidth={major ? 1.2 : 0.5}
              />
            );
          })}
          <circle cx="100" cy="100" r="74" fill="none" stroke="var(--color-sunk)" strokeWidth="9" />
          <g transform="rotate(-90 100 100)">
            {arcs.map((arc) => (
              <circle
                key={arc.label}
                cx="100"
                cy="100"
                r="74"
                fill="none"
                pathLength={100}
                stroke="var(--color-ink)"
                strokeOpacity={arc.tone}
                strokeWidth="9"
                className="transition-[stroke-dasharray,stroke-dashoffset] duration-500 ease-(--ease-out)"
                style={
                  {
                    strokeDasharray: `${arc.length} ${100 - arc.length}`,
                    strokeDashoffset: -arc.start,
                  } as CSSProperties
                }
              />
            ))}
          </g>
          <polygon points="100,3 104,13 96,13" fill="var(--color-brass)" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
          <span className="index text-ink-3">{centerLabel}</span>
          <span className="max-w-[9.5rem] serif text-[1.375rem] leading-tight font-[400] tracking-[-0.01em]">
            {centerValue}
          </span>
        </div>
      </div>
      <figcaption className="w-full">
        <p className="sr-only">{caption}</p>
        <ul className="flex flex-col">
          {arcs.map((arc) => (
            <li
              key={arc.label}
              className="flex items-baseline justify-between gap-4 border-b border-rule py-2 text-[0.8125rem]"
            >
              <span className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="size-2.5 rounded-full bg-ink"
                  style={{ opacity: arc.tone }}
                />
                {arc.label}
              </span>
              <span className="whitespace-nowrap text-ink-2">{arc.detail}</span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}

type GuillocheProps = {
  /** Number of interlaced rings. */
  rings?: number;
  /** Waves around each ring. */
  lobes?: number;
  className?: string;
};

const SIZE = 400;
const STEPS = 360;

/**
 * An engine-turned rosette, as on a watch dial: rings of radius r(θ) = R + A·sin(kθ + φ), each
 * ring phase-shifted so the curves interlace. Drawn once on the server as plain SVG paths and
 * shown at very low contrast, so it reads as texture only up close.
 */
export function guillochePaths(rings: number, lobes: number): string[] {
  const center = SIZE / 2;
  return Array.from({ length: rings }, (_, ring) => {
    const radius = 40 + ring * (150 / rings);
    const amplitude = 6 + (ring % 3) * 2;
    const phase = (ring * Math.PI) / (rings / 2);
    const points = Array.from({ length: STEPS + 1 }, (_, step) => {
      const theta = (step / STEPS) * Math.PI * 2;
      const r = radius + amplitude * Math.sin(lobes * theta + phase);
      return `${(center + r * Math.cos(theta)).toFixed(2)} ${(center + r * Math.sin(theta)).toFixed(2)}`;
    });
    return `M${points.join('L')}Z`;
  });
}

export function Guilloche({ rings = 28, lobes = 18, className }: GuillocheProps) {
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
    >
      {guillochePaths(rings, lobes).map((d, index) => (
        <path key={index} d={d} strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

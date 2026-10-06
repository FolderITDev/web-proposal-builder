import { logoShapes } from '@/lib/brand/logo';
import { type BrandLogo as BrandLogoKind } from '@/lib/validation/proposal';

type BrandLogoProps = {
  logo: BrandLogoKind;
  companyName: string;
  color: string;
  size?: number;
  className?: string;
};

/** A brand mark drawn from the shared logo geometry. */
export function BrandLogo({ logo, companyName, color, size = 40, className }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`${companyName} logo`}
    >
      {logoShapes(logo, companyName).map((shape, index) => {
        switch (shape.kind) {
          case 'circle':
            return shape.fill ? (
              <circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} fill={color} />
            ) : (
              <circle
                key={index}
                cx={shape.cx}
                cy={shape.cy}
                r={shape.r}
                fill="none"
                stroke={color}
                strokeWidth={shape.strokeWidth}
              />
            );
          case 'rect':
            return (
              <rect
                key={index}
                x={shape.x}
                y={shape.y}
                width={shape.width}
                height={shape.height}
                fill={color}
                opacity={shape.opacity}
              />
            );
          case 'polygon':
            return (
              <polygon key={index} points={shape.points} fill={shape.fill ? color : '#ffffff'} />
            );
          case 'text':
            return (
              <text
                key={index}
                x={shape.x}
                y={shape.y}
                textAnchor="middle"
                fontSize={shape.size}
                fontWeight={600}
                fill="#ffffff"
                fontFamily="var(--font-sans)"
              >
                {shape.value}
              </text>
            );
        }
      })}
    </svg>
  );
}

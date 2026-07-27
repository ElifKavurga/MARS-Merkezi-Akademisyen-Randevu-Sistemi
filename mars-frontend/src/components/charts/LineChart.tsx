import { useState } from 'react';
import ChartTooltip from './ChartTooltip';
import EmptyChart from './EmptyChart';

interface DataPoint {
  label: string;
  value: number;
}

export default function LineChart({ data, onClick }: { data: DataPoint[], onClick?: (label: string, value: number) => void }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) return <EmptyChart />;

  const W = 500, H = 160, padX = 30, padY = 20;
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1 || 1)) * (W - padX * 2);
    const y = padY + (1 - d.value / maxVal) * (H - padY * 2);
    return { x, y, label: d.label, value: d.value };
  });

  const hoveredPoint = hoverIndex === null ? null : points[hoverIndex];
  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const area = [
    `${points[0].x},${H - padY}`,
    ...points.map((p) => `${p.x},${p.y}`),
    `${points[points.length - 1].x},${H - padY}`,
  ].join(' ');

  return (
    <div className="overflow-x-auto animate-fade-in">
      <div className="relative min-w-[280px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full drop-shadow-sm" aria-label="Çizgi grafik">
          <polygon
            points={area}
            fill="rgba(var(--color-primary, 99,102,241), 0.08)"
            className="transition-all duration-700 ease-in-out"
          />

          <polyline
            points={polyline}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-primary transition-all duration-700 ease-in-out"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map((p, i) => (
            <g
              key={p.label}
              className={onClick ? 'cursor-pointer' : undefined}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              onFocus={() => setHoverIndex(i)}
              onBlur={() => setHoverIndex(null)}
              onClick={() => onClick?.(p.label, p.value)}
              role={onClick ? 'button' : undefined}
              tabIndex={onClick ? 0 : undefined}
            >
              <circle cx={p.x} cy={p.y} r="15" fill="transparent" />
              <circle
                cx={p.x}
                cy={p.y}
                r={hoverIndex === i ? '6' : '4'}
                className={`fill-surface transition-all duration-300 stroke-[2px] ${
                  hoverIndex === i ? 'stroke-primary shadow-lg' : 'stroke-primary'
                }`}
              />
            </g>
          ))}

          {points.map((p, i) => (
            <text
              key={`lbl-${p.label}`}
              x={p.x}
              y={H - 4}
              textAnchor="middle"
              fontSize="9"
              className={`transition-colors duration-200 fontFamily-inherit ${hoverIndex === i ? 'fill-primary font-medium' : 'fill-on-surface-variant'}`}
            >
              {p.label.length > 5 ? p.label.slice(5) : p.label}
            </text>
          ))}
        </svg>
        {hoveredPoint ? (
          <ChartTooltip
            label={hoveredPoint.label}
            value={hoveredPoint.value}
            x={hoveredPoint.x}
            y={hoveredPoint.y}
            width={W}
            height={H}
          />
        ) : null}
      </div>
    </div>
  );
}

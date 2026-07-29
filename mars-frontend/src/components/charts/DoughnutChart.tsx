import { useState } from 'react';
import ChartTooltip from './ChartTooltip';
import EmptyChart from './EmptyChart';

interface DataPoint {
  label: string;
  value: number;
  color: string;
}

export default function DoughnutChart({ data, onClick }: { data: DataPoint[], onClick?: (label: string, value: number) => void }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0 || data.every((d) => d.value === 0)) return <EmptyChart />;

  const total = data.reduce((s, d) => s + d.value, 0);
  const W = 160, H = 160, R = 60, cx = 80, cy = 80, strokeWidthBase = 22;
  const circumference = 2 * Math.PI * R;
  let offset = 0;
  const segments = data.map((d) => {
    const pct = d.value / total;
    const dash = pct * circumference;
    const dashOffset = circumference - offset * circumference;
    const midAngle = (offset + pct / 2) * Math.PI * 2 - Math.PI / 2;
    offset += pct;

    return {
      ...d,
      dash,
      dashOffset,
      tooltipX: cx + Math.cos(midAngle) * (R + strokeWidthBase / 2),
      tooltipY: cy + Math.sin(midAngle) * (R + strokeWidthBase / 2),
    };
  });
  const hoveredSegment = hoverIndex === null ? null : segments[hoverIndex];

  return (
    <div className="flex min-w-0 flex-col items-center gap-4 animate-fade-in sm:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full drop-shadow-sm" aria-label="Halka grafik">
          {segments.map((d, i) => {
            const isHovered = hoverIndex === i;
            const isFaded = hoverIndex !== null && !isHovered;

            return (
              <circle
                key={d.label}
                cx={cx}
                cy={cy}
                r={R}
                fill="none"
                stroke={d.color}
                strokeWidth={isHovered ? strokeWidthBase + 4 : strokeWidthBase}
                strokeDasharray={`${d.dash} ${circumference - d.dash}`}
                strokeDashoffset={d.dashOffset}
                className={`transition-all duration-300 ease-in-out ${onClick ? 'cursor-pointer' : ''} ${
                  isFaded ? 'opacity-40' : 'opacity-100'
                }`}
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: `${cx}px ${cy}px`,
                }}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => setHoverIndex(i)}
                onBlur={() => setHoverIndex(null)}
                onClick={() => onClick?.(d.label, d.value)}
                role={onClick ? 'button' : undefined}
                tabIndex={onClick ? 0 : undefined}
              />
            );
          })}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" className="fill-on-surface-variant transition-colors" fontFamily="inherit">
            {hoverIndex !== null ? data[hoverIndex].label.substring(0, 12) : 'Toplam'}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="16" fontWeight="bold" className="fill-on-surface transition-all" fontFamily="inherit">
            {hoverIndex !== null ? data[hoverIndex].value : total}
          </text>
        </svg>
        {hoveredSegment ? (
          <ChartTooltip
            label={hoveredSegment.label}
            value={hoveredSegment.value}
            x={hoveredSegment.tooltipX}
            y={hoveredSegment.tooltipY}
            width={W}
            height={H}
          />
        ) : null}
      </div>
      <ul className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm">
        {segments.map((d, i) => {
          const isHovered = hoverIndex === i;
          const isFaded = hoverIndex !== null && !isHovered;

          return (
            <li
              key={d.label}
              className={`flex min-w-0 items-center gap-2 rounded-md p-1.5 transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${
                isHovered ? 'scale-[1.02] bg-surface-container-high shadow-sm' : isFaded ? 'opacity-50' : 'hover:bg-surface-container'
              }`}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              onClick={() => onClick?.(d.label, d.value)}
            >
              <span
                className={`inline-block h-3.5 w-3.5 shrink-0 rounded-full transition-transform ${isHovered ? 'scale-110' : ''}`}
                style={{ background: d.color }}
              />
              <span
                className={`min-w-0 flex-1 truncate transition-colors ${isHovered ? 'font-medium text-on-surface' : 'text-on-surface-variant'}`}
                title={d.label}
              >
                {d.label}
              </span>
              <span className={`w-6 shrink-0 text-right font-semibold transition-colors ${isHovered ? 'text-primary' : 'text-on-surface'}`}>
                {d.value}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

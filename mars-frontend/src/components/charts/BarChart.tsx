import { useState } from 'react';
import ChartTooltip from './ChartTooltip';
import EmptyChart from './EmptyChart';

interface DataPoint {
  label: string;
  value: number;
}

const BAR_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#84cc16',
  '#f97316', '#64748b', '#a78bfa', '#34d399',
];

export default function BarChart({ data, onClick }: { data: DataPoint[], onClick?: (label: string, value: number) => void }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) return <EmptyChart />;

  const W = 500, H = 160, padX = 30, padY = 20, gap = 8;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barW = (W - padX * 2 - gap * (data.length - 1)) / data.length;
  const hoveredBar = hoverIndex === null
    ? null
    : {
        label: data[hoverIndex].label,
        value: data[hoverIndex].value,
        x: padX + hoverIndex * (barW + gap) + barW / 2,
        y: H - padY - (data[hoverIndex].value / maxVal) * (H - padY * 2),
      };

  return (
    <div className="overflow-x-auto animate-fade-in">
      <div className="relative min-w-[280px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-label="Çubuk grafik">
          {data.map((d, i) => {
            const barH = (d.value / maxVal) * (H - padY * 2);
            const x = padX + i * (barW + gap);
            const y = H - padY - barH;
            const isHovered = hoverIndex === i;
            const isFaded = hoverIndex !== null && !isHovered;

            return (
              <g
                key={d.label}
                className={onClick ? 'cursor-pointer' : undefined}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => setHoverIndex(i)}
                onBlur={() => setHoverIndex(null)}
                onClick={() => onClick?.(d.label, d.value)}
                role={onClick ? 'button' : undefined}
                tabIndex={onClick ? 0 : undefined}
              >
                <rect x={x} y={padY} width={barW} height={H - padY * 2} fill="transparent" />
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx="4"
                  fill={BAR_COLORS[i % BAR_COLORS.length]}
                  className={`origin-bottom transition-all duration-300 ease-out ${isHovered ? 'opacity-100' : isFaded ? 'opacity-40' : 'opacity-85'}`}
                />

                <text
                  x={x + barW / 2}
                  y={H - 4}
                  textAnchor="middle"
                  fontSize="8"
                  className={`transition-colors duration-200 fontFamily-inherit ${isHovered ? 'fill-primary font-bold' : 'fill-on-surface-variant'}`}
                >
                  {d.label.length > 8 ? `${d.label.slice(0, 7)}...` : d.label}
                </text>
              </g>
            );
          })}
        </svg>
        {hoveredBar ? (
          <ChartTooltip
            label={hoveredBar.label}
            value={hoveredBar.value}
            x={hoveredBar.x}
            y={hoveredBar.y}
            width={W}
            height={H}
          />
        ) : null}
      </div>
    </div>
  );
}

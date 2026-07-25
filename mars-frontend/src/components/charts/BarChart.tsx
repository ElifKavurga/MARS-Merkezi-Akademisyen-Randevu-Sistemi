import { useState } from 'react';
import EmptyChart from './EmptyChart';

interface DataPoint {
  label: string;
  value: number;
}

const BAR_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', 
  '#f59e0b', '#ef4444', '#ec4899', '#84cc16', 
  '#f97316', '#64748b', '#a78bfa', '#34d399'
];

export default function BarChart({ data, onClick }: { data: DataPoint[], onClick?: (label: string, value: number) => void }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) return <EmptyChart />;

  const W = 500, H = 160, padX = 30, padY = 20, gap = 8;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barW = (W - padX * 2 - gap * (data.length - 1)) / data.length;

  return (
    <div className="overflow-x-auto animate-fade-in relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minWidth: 280 }} aria-label="Çubuk grafik">
        {data.map((d, i) => {
          const barH = (d.value / maxVal) * (H - padY * 2);
          const x = padX + i * (barW + gap);
          const y = H - padY - barH;
          const isHovered = hoverIndex === i;
          const isFaded = hoverIndex !== null && !isHovered;

          return (
            <g 
              key={i} 
              className={`group ${onClick ? 'cursor-pointer' : ''}`}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              onClick={() => onClick && onClick(d.label, d.value)}
            >
              {/* Invisible full-height rect for easier hover detection */}
              <rect x={x} y={padY} width={barW} height={H - padY * 2} fill="transparent" />

              {/* Bar */}
              <rect 
                x={x} 
                y={y} 
                width={barW} 
                height={barH} 
                rx="4" 
                fill={BAR_COLORS[i % BAR_COLORS.length]} 
                className={`transition-all duration-300 ease-out origin-bottom ${isHovered ? 'opacity-100' : isFaded ? 'opacity-40' : 'opacity-85'}`}
              />
              
              {/* Tooltip value */}
              <g className={`transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="10" fontWeight="bold" className="fill-on-surface" fontFamily="inherit">
                  {d.value}
                </text>
              </g>

              {/* Label */}
              <text 
                x={x + barW / 2} 
                y={H - 4} 
                textAnchor="middle" 
                fontSize="8" 
                className={`transition-colors duration-200 fontFamily-inherit ${isHovered ? 'fill-primary font-bold' : 'fill-on-surface-variant'}`}
              >
                {d.label.length > 8 ? d.label.slice(0, 7) + '…' : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

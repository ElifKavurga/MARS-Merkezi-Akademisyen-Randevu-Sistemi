import { useState } from 'react';
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
  const R = 60, cx = 80, cy = 80, strokeWidthBase = 22;
  const circumference = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 animate-fade-in">
      <div className="relative w-40 h-40 shrink-0">
        <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-sm" aria-label="Halka grafik">
          {data.map((d, i) => {
            const pct = d.value / total;
            const dash = pct * circumference;
            const dashOffset = circumference - offset * circumference;
            offset += pct;
            
            const isHovered = hoverIndex === i;
            const isFaded = hoverIndex !== null && !isHovered;

            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={R}
                fill="none"
                stroke={d.color}
                strokeWidth={isHovered ? strokeWidthBase + 4 : strokeWidthBase}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={dashOffset}
                className={`transition-all duration-300 ease-in-out ${onClick ? 'cursor-pointer' : ''} ${
                  isFaded ? 'opacity-40' : 'opacity-100'
                }`}
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: `${cx}px ${cy}px`,
                }}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                onClick={() => onClick && onClick(d.label, d.value)}
              >
                <title>{`${d.label}: ${d.value}`}</title>
              </circle>
            );
          })}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" className="fill-on-surface-variant transition-colors" fontFamily="inherit">
            {hoverIndex !== null ? data[hoverIndex].label.substring(0, 10) : 'Toplam'}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="16" fontWeight="bold" className="fill-on-surface transition-all" fontFamily="inherit">
            {hoverIndex !== null ? data[hoverIndex].value : total}
          </text>
        </svg>
      </div>
      <ul className="flex flex-col gap-2 text-sm w-full">
        {data.map((d, i) => {
          const isHovered = hoverIndex === i;
          const isFaded = hoverIndex !== null && !isHovered;
          
          return (
            <li
              key={i}
              className={`flex items-center gap-2 p-1.5 rounded-md transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${
                isHovered ? 'bg-surface-container-high shadow-sm scale-[1.02]' : isFaded ? 'opacity-50' : 'hover:bg-surface-container'
              }`}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              onClick={() => onClick && onClick(d.label, d.value)}
            >
              <span 
                className={`inline-block h-3.5 w-3.5 rounded-full shrink-0 transition-transform ${isHovered ? 'scale-110' : ''}`} 
                style={{ background: d.color }} 
              />
              <span className={`transition-colors ${isHovered ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>
                {d.label}
              </span>
              <span className={`ml-auto font-semibold transition-colors ${isHovered ? 'text-primary' : 'text-on-surface'}`}>
                {d.value}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

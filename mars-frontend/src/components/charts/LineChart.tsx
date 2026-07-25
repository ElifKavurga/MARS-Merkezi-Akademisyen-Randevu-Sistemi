import { useState } from 'react';
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

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const area = [
    `${points[0].x},${H - padY}`,
    ...points.map((p) => `${p.x},${p.y}`),
    `${points[points.length - 1].x},${H - padY}`,
  ].join(' ');

  return (
    <div className="overflow-x-auto animate-fade-in relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto drop-shadow-sm" style={{ minWidth: 280 }} aria-label="Çizgi grafik">
        {/* Area fill with animation */}
        <polygon 
          points={area} 
          fill="rgba(var(--color-primary, 99,102,241), 0.08)" 
          className="transition-all duration-700 ease-in-out"
        />
        
        {/* Line */}
        <polyline 
          points={polyline} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          className="text-primary transition-all duration-700 ease-in-out" 
          strokeLinejoin="round" 
          strokeLinecap="round" 
        />
        
        {/* Interactive Points */}
        {points.map((p, i) => (
          <g 
            key={i} 
            className={`group ${onClick ? 'cursor-pointer' : ''}`}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
            onClick={() => onClick && onClick(p.label, p.value)}
          >
            {/* Invisible larger circle for easier hover */}
            <circle cx={p.x} cy={p.y} r="15" fill="transparent" />
            
            {/* Visible point */}
            <circle 
              cx={p.x} 
              cy={p.y} 
              r={hoverIndex === i ? "6" : "4"} 
              className={`fill-surface transition-all duration-300 stroke-[2px] ${
                hoverIndex === i ? 'stroke-primary shadow-lg' : 'stroke-primary'
              }`} 
            />
            
            {/* Value Tooltip (SVG text) */}
            <g className={`transition-opacity duration-200 ${hoverIndex === i ? 'opacity-100' : 'opacity-0'}`}>
              <rect x={p.x - 20} y={p.y - 30} width="40" height="20" rx="4" className="fill-on-surface" opacity="0.9" />
              <text x={p.x} y={p.y - 16} textAnchor="middle" fontSize="10" className="fill-surface" fontWeight="bold" fontFamily="inherit">
                {p.value}
              </text>
            </g>
          </g>
        ))}

        {/* X labels */}
        {points.map((p, i) => (
          <text 
            key={`lbl-${i}`} 
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
    </div>
  );
}

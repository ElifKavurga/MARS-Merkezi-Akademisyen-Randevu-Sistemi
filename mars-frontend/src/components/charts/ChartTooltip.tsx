type ChartTooltipProps = {
  label: string;
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function ChartTooltip({
  label,
  value,
  x,
  y,
  width,
  height,
}: ChartTooltipProps) {
  const left = `${(x / width) * 100}%`;
  const top = `${(y / height) * 100}%`;
  const placeBelow = y < 64;

  return (
    <div
      className="pointer-events-none absolute z-20 max-w-36 rounded-lg border border-outline-variant/60 bg-on-surface px-3 py-2 text-center shadow-lg"
      style={{
        left: `clamp(4.5rem, ${left}, calc(100% - 4.5rem))`,
        top: placeBelow
          ? `clamp(0.5rem, calc(${top} + 0.75rem), calc(100% - 3rem))`
          : `clamp(3rem, calc(${top} - 0.75rem), calc(100% - 0.5rem))`,
        transform: placeBelow
          ? 'translate(-50%, 0)'
          : 'translate(-50%, -100%)',
      }}
      role="tooltip"
    >
      <span className="block truncate font-label-sm text-[11px] leading-4 text-surface">
        {label}
      </span>
      <span className="block font-title-sm text-sm font-semibold leading-5 text-surface">
        {value}
      </span>
    </div>
  );
}

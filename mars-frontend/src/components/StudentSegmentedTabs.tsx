type StudentSegmentedTabsProps<T extends string> = {
  value: T;
  options: readonly { value: T; label: string }[];
  ariaLabel: string;
  onChange: (value: T) => void;
};

export default function StudentSegmentedTabs<T extends string>({
  value,
  options,
  ariaLabel,
  onChange,
}: StudentSegmentedTabsProps<T>) {
  return (
    <div
      className="inline-flex w-full max-w-lg gap-1.5 rounded-2xl bg-surface-container/80 p-1.5 sm:w-auto"
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`min-w-0 flex-1 rounded-xl px-4 py-2.5 font-label-md text-label-md transition-colors duration-200 ease-out sm:flex-none sm:min-w-[9.5rem] ${
              active
                ? 'bg-primary-container text-on-primary'
                : 'bg-transparent text-on-surface-variant hover:bg-white/60 hover:text-on-surface'
            }`}
            onClick={() => onChange(option.value)}
          >
            <span className="block truncate text-center">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

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
      className="inline-flex w-full max-w-md rounded-xl bg-surface-container p-1 sm:w-auto"
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
            className={`min-w-0 flex-1 rounded-lg px-3 py-2 font-label-md text-label-md transition-all duration-200 ease-out sm:flex-none sm:px-4 ${
              active
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'bg-transparent text-on-surface-variant hover:bg-surface-container-high/70 hover:text-on-surface'
            }`}
            onClick={() => onChange(option.value)}
          >
            <span className="block truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

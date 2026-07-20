import { useRef, type KeyboardEvent } from 'react';

type StudentSegmentedTabsProps<T extends string> = {
  value: T;
  options: readonly { value: T; label: string }[];
  ariaLabel: string;
  onChange: (value: T) => void;
};

/** Segmented control with tablist semantics and arrow-key navigation. */
export default function StudentSegmentedTabs<T extends string>({
  value,
  options,
  ariaLabel,
  onChange,
}: StudentSegmentedTabsProps<T>) {
  const buttonRefs = useRef(new Map<T, HTMLButtonElement>());

  const focusValue = (next: T) => {
    onChange(next);
    window.requestAnimationFrame(() => {
      buttonRefs.current.get(next)?.focus();
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = options.findIndex((option) => option.value === value);
    if (index < 0) {
      return;
    }

    let nextIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % options.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + options.length) % options.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = options.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    focusValue(options[nextIndex].value);
  };

  return (
    <div
      className="inline-flex w-full max-w-lg gap-1.5 rounded-2xl bg-surface-container/80 p-1.5 sm:w-auto"
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              if (node) {
                buttonRefs.current.set(option.value, node);
              } else {
                buttonRefs.current.delete(option.value);
              }
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            className={`min-w-0 flex-1 rounded-xl px-4 py-2.5 font-label-md text-label-md transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim focus-visible:ring-offset-2 sm:flex-none sm:min-w-[9.5rem] ${
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

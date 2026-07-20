import type { KeyboardEvent } from 'react';

/**
 * radiogroup içindeki radio butonlarda ok tuşu ile dolaşım.
 * Davranışı bozmadan erişilebilirlik iyileştirmesi.
 */
export function handleRadiogroupKeyDown(
  event: KeyboardEvent<HTMLElement>,
  optionCount: number,
  selectedIndex: number,
  onSelectIndex: (index: number) => void,
): void {
  if (optionCount < 1) {
    return;
  }

  let nextIndex = selectedIndex;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault();
    nextIndex = selectedIndex < 0 ? 0 : (selectedIndex + 1) % optionCount;
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault();
    nextIndex =
      selectedIndex < 0
        ? optionCount - 1
        : (selectedIndex - 1 + optionCount) % optionCount;
  } else if (event.key === 'Home') {
    event.preventDefault();
    nextIndex = 0;
  } else if (event.key === 'End') {
    event.preventDefault();
    nextIndex = optionCount - 1;
  } else {
    return;
  }

  onSelectIndex(nextIndex);
}

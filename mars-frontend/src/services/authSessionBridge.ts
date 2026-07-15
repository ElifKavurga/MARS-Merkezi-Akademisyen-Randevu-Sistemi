import { STORAGE_KEYS } from '../constants/storage';

type ClearSessionHandler = () => void;

let clearSessionHandler: ClearSessionHandler | null = null;

export function registerClearSessionHandler(handler: ClearSessionHandler): void {
  clearSessionHandler = handler;
}

export function unregisterClearSessionHandler(handler: ClearSessionHandler): void {
  if (clearSessionHandler === handler) {
    clearSessionHandler = null;
  }
}

export function triggerClearSession(): void {
  if (clearSessionHandler) {
    clearSessionHandler();
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_TYPE);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

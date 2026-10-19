import { useSyncExternalStore } from 'react';
import { keyboardStore, type KeyboardState } from '../native/keyboardStore';

export type { KeyboardState };

/**
 * System and custom keyboard state. `isKeyboardUp` and `keyboardHeight` cover
 * both keyboards, so the height holds steady while a custom keyboard and the
 * system keyboard swap.
 */
export const useKeyboard = (): KeyboardState =>
  useSyncExternalStore(keyboardStore.subscribe, keyboardStore.getSnapshot);

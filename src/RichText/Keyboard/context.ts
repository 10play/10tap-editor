import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react';
import {
  keyboardStore,
  type CustomKeyboardControls,
} from '../../native/keyboardStore';
import type { EditorBridge } from '../../types';

/** Controls of the `CustomKeyboard` rendering the current keyboard body. */
export const CustomKeyboardContext =
  createContext<CustomKeyboardControls | null>(null);

const noop = () => {};

/**
 * Opens, switches and closes custom keyboards from anywhere, e.g. a toolbar.
 * Targets the `CustomKeyboard` of `editor`; without one, the keyboard whose
 * body renders the caller, else the most recently mounted `CustomKeyboard`.
 */
export const useCustomKeyboard = (
  editor?: EditorBridge
): CustomKeyboardControls => {
  const fromContext = useContext(CustomKeyboardContext);
  const host = useSyncExternalStore(keyboardStore.subscribe, () =>
    keyboardStore.getHost(editor)
  );
  const target =
    editor === undefined && fromContext ? fromContext : host?.controls;
  const activeKeyboardID = useSyncExternalStore(
    keyboardStore.subscribe,
    () => target?.activeKeyboardID
  );
  return useMemo(
    () => ({
      activeKeyboardID,
      open: target ? (id: string) => target.open(id) : noop,
      close: target ? (toSystem?: boolean) => target.close(toSystem) : noop,
      dismiss: target ? () => target.dismiss() : noop,
    }),
    [activeKeyboardID, target]
  );
};

/**
 * Height the custom keyboard occupies, 0 while it is closed. For layouts that
 * follow the system keyboard themselves (e.g. react-native-keyboard-controller)
 * and need to reserve the custom keyboard's space too.
 */
export const useCustomKeyboardHeight = (editor?: EditorBridge): number =>
  useSyncExternalStore(keyboardStore.subscribe, () => {
    const host = keyboardStore.getHost(editor);
    return host?.state.open ? host.state.height : 0;
  });

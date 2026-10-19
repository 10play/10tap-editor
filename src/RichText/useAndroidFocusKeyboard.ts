import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { Platform, TextInput } from 'react-native';
import type { EditorController } from '../shared/contracts';
import type { EditorBridge } from '../types';
import { REFOCUS_DELAY_MS } from './Keyboard/drivers';
import { getNativeKeyboardModule } from './Keyboard/nativeModule';
import { AUTOFOCUS_KEYBOARD_CHECK_MS } from './utils';

/**
 * How long after the app's `editor.focus()` the IME must be up. The focus
 * reaches the WebView after 100 ms on Android, and a hide that raced it has
 * reported itself by then.
 */
export const FOCUS_KEYBOARD_CHECK_MS = 500;

const FOCUS_COMMAND = 'focus';

/**
 * Android: brings up the IME that focusing the editor should have shown.
 *
 * - Autofocus shows it through a hidden autoFocus TextInput. That request is
 *   lost when its window has no focus yet (a Modal), when the previous
 *   screen's editor hides the IME while unmounting, or when the device is
 *   not in touch mode (after a D-pad or hardware key press).
 * - `editor.focus()` only moves the focus to the WebView. When another
 *   TextInput had the focus and unmounts in the same tick (a search bar
 *   closing), React Native blurs it natively and that hides the IME just
 *   after the editor asked for it.
 *
 * So once the editor was focused, an IME that is still down is shown: with
 * the native module for the focused WebView, else through the hidden input
 * (autofocus only, as it is not rendered otherwise). One attempt per focus,
 * and the attempt's own focus call is internal, so it never repeats itself.
 * Nothing happens while another TextInput has the focus or a keyboard
 * (system or custom) is up.
 */
export const useAndroidFocusKeyboard = (
  editor: EditorBridge,
  controller: EditorController,
  hiddenInput: RefObject<TextInput | null>,
  isKeyboardUp: boolean
) => {
  const enabled = Platform.OS === 'android';
  const autofocus = enabled && editor.autofocus;
  const keyboardUp = useRef(isKeyboardUp);
  useLayoutEffect(() => {
    keyboardUp.current = isKeyboardUp;
  });

  useEffect(() => {
    if (!enabled) return;
    const token = Symbol('tentap.focusKeyboard');
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    // Readiness checks the autofocus call itself, later.
    let autofocusPending = false;
    const schedule = (ms: number, fn: () => void) => {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };

    const otherInputFocused = () => {
      const focused = TextInput.State.currentlyFocusedInput();
      return focused !== null && focused !== hiddenInput.current;
    };

    const showWithHiddenInput = () => {
      const input = hiddenInput.current;
      if (!input) return;
      // Focusing an input that already has focus does not show the IME.
      if (TextInput.State.currentlyFocusedInput() === input) input.blur();
      input.focus();
      schedule(REFOCUS_DELAY_MS, () =>
        controller.runInternal(token, () => editor.focus?.())
      );
    };

    const showKeyboard = async (requireFocus: boolean) => {
      const current = ++attempt;
      const stale = () =>
        current !== attempt || keyboardUp.current || otherInputFocused();
      if (stale() || !controller.isReady()) return;
      if (requireFocus && editor.getEditorState().isFocused !== true) return;
      const native = getNativeKeyboardModule();
      if (native) {
        const visible = await native
          .isSystemKeyboardVisible()
          .catch(() => false);
        if (visible || stale()) return;
        if (await native.showSystemKeyboard().catch(() => false)) return;
        if (stale()) return;
      }
      showWithHiddenInput();
    };

    const unsubscribeReady = controller.subscribeReady((ready) => {
      clearTimeout(timer);
      attempt++;
      autofocusPending = ready && autofocus;
      if (!autofocusPending) return;
      schedule(AUTOFOCUS_KEYBOARD_CHECK_MS, () => {
        autofocusPending = false;
        void showKeyboard(false);
      });
    });
    const unsubscribeCommands = controller.onCommand((message, meta) => {
      if (message.type !== FOCUS_COMMAND || meta.internal !== undefined) {
        return;
      }
      if (autofocusPending) return;
      schedule(FOCUS_KEYBOARD_CHECK_MS, () => void showKeyboard(true));
    });
    return () => {
      unsubscribeReady();
      unsubscribeCommands();
      clearTimeout(timer);
      attempt++;
    };
  }, [autofocus, controller, editor, enabled, hiddenInput]);
};

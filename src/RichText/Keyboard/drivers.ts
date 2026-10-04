import type { Spec as NativeKeyboardModule } from '../../specs/NativeTenTapKeyboard';
import type { EditorChannel } from './editorChannel';
import {
  INPUT_MODE_RESTORE_SCRIPT,
  INPUT_MODE_SUPPRESS_SCRIPT,
} from './webSnippets';

export type { NativeKeyboardModule };

/**
 * - `native`: the `TenTapKeyboard` module suppresses the system keyboard while
 *   the WebView keeps first responder / focus.
 * - `fallback`: no native code; `inputmode="none"` plus, on Android, a hidden
 *   TextInput to bring the IME back.
 * - `inline`: platforms without a system keyboard to suppress (web); the
 *   custom keyboard is just rendered.
 */
export type KeyboardDriverKind = 'native' | 'fallback' | 'inline';

export interface KeyboardDriver {
  readonly kind: KeyboardDriverKind;
  /** Hides the system keyboard, keeping editor focus. False when it could not. */
  suppress(): Promise<boolean>;
  /** Ends the suppression and shows the system keyboard for the editor. */
  restore(): Promise<boolean>;
  /**
   * Ends the suppression without showing the system keyboard. Idempotent and
   * safe when nothing is suppressed. On iOS the editor must be blurred first.
   */
  release(): Promise<void>;
  /** Android `'stable'` mode (ADJUST_NOTHING). False when not applied. */
  setWindowOverlayMode(enabled: boolean): Promise<boolean>;
  /** Bottom navigation bar inset in dp on edge-to-edge Android, else 0. */
  getNavigationBarInset(): Promise<number>;
}

export interface HiddenInputHandle {
  focus(): void;
}

export interface DriverContext {
  platform: string;
  channel: EditorChannel;
  /** The 1x1 TextInput `CustomKeyboard` renders on Android. */
  getHiddenInput(): HiddenInputHandle | null;
}

/** Persistent script key of the fallback driver's `inputmode` latch. */
export const INPUT_MODE_SCRIPT_KEY = 'tentap.keyboard.inputMode';

/** Delay between focusing the hidden input and handing focus back to the editor. */
export const FALLBACK_REFOCUS_DELAY_MS = 50;

const resolved = <T>(value: T) => Promise.resolve(value);

export const hasSystemKeyboard = (platform: string) =>
  platform === 'ios' || platform === 'android';

export const createNativeDriver = (
  module: NativeKeyboardModule,
  { platform, channel }: DriverContext
): KeyboardDriver => ({
  kind: 'native',
  suppress: () => module.setSystemKeyboardSuppressed(true),
  restore: () => module.setSystemKeyboardSuppressed(false),
  async release() {
    if (platform === 'android') {
      // The native restore also shows the IME; dropping the latch does not.
      channel.injectScript(INPUT_MODE_RESTORE_SCRIPT);
      return;
    }
    await module.setSystemKeyboardSuppressed(false).catch(() => false);
  },
  setWindowOverlayMode: (enabled) =>
    platform === 'android'
      ? module.setWindowOverlayMode(enabled)
      : resolved(false),
  getNavigationBarInset: () =>
    platform === 'android' ? module.getNavigationBarInset() : resolved(0),
});

export const createFallbackDriver = ({
  platform,
  channel,
  getHiddenInput,
}: DriverContext): KeyboardDriver => {
  const unlatch = () => {
    channel.setPersistentScript(INPUT_MODE_SCRIPT_KEY, null);
    channel.injectScript(INPUT_MODE_RESTORE_SCRIPT);
  };
  return {
    kind: 'fallback',
    suppress() {
      channel.setPersistentScript(
        INPUT_MODE_SCRIPT_KEY,
        INPUT_MODE_SUPPRESS_SCRIPT
      );
      return resolved(true);
    },
    restore() {
      unlatch();
      if (platform !== 'android') return resolved(true);
      // Chromium does not show the IME again when inputmode changes. A focused
      // TextInput brings it up, and it stays up when focus moves back.
      const hiddenInput = getHiddenInput();
      if (!hiddenInput) return resolved(false);
      hiddenInput.focus();
      return new Promise((resolve) =>
        setTimeout(() => {
          channel.focus();
          resolve(true);
        }, FALLBACK_REFOCUS_DELAY_MS)
      );
    },
    release() {
      unlatch();
      return resolved(undefined);
    },
    setWindowOverlayMode: () => resolved(false),
    getNavigationBarInset: () => resolved(0),
  };
};

export const createInlineDriver = (): KeyboardDriver => ({
  kind: 'inline',
  suppress: () => resolved(true),
  restore: () => resolved(true),
  release: () => resolved(undefined),
  setWindowOverlayMode: () => resolved(false),
  getNavigationBarInset: () => resolved(0),
});

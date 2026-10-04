// Codegen spec for the TenTapKeyboard native module. Keep this file literal:
// no conditionals or Platform checks (codegen parses it statically).
// `yarn check:codegen` validates the parsed schema.
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { Double } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  /**
   * iOS: installs/removes an empty inputView on the WKWebView that owns the first responder.
   * Android: sets/removes `inputmode` on the focused WebView, then hides/shows the soft input.
   * Resolves false when no focused WebView is found in the activity window.
   */
  setSystemKeyboardSuppressed(suppressed: boolean): Promise<boolean>;
  /** Android: focuses the WebView and shows the soft input. iOS: resolves false. */
  showSystemKeyboard(): Promise<boolean>;
  /** Whether the system keyboard is currently visible. */
  isSystemKeyboardVisible(): Promise<boolean>;
  /**
   * Android API 30+: sets ADJUST_NOTHING on the activity window (restored when disabled).
   * Resolves false when not applied (iOS, API < 30, Dialog window).
   */
  setWindowOverlayMode(enabled: boolean): Promise<boolean>;
  /** Android: bottom navigation bar inset in dp when edge-to-edge, otherwise 0. iOS: 0. */
  getNavigationBarInset(): Promise<Double>;
}

// null when the native module is not linked (Expo Go, web); callers fall back to the JS driver.
export default TurboModuleRegistry.get<Spec>('TenTapKeyboard');

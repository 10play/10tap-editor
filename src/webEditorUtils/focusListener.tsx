import { isExpo } from '../utils/misc';

// Type guard to check if we're in a browser/webview context
const hasDocument = (): boolean => {
  // @ts-ignore - window may not be defined in all contexts
  return (
    // @ts-ignore
    typeof window !== 'undefined' &&
    // @ts-ignore
    typeof window.document !== 'undefined'
  );
};

class FocusListener {
  private focus: boolean;
  constructor() {
    this.focus = false;

    // Only add event listeners if we're in a webview context where document exists
    if (hasDocument()) {
      // @ts-ignore
      window.document.addEventListener(
        'focus',
        () => {
          this.focus = true;
        },
        true
      );
      // @ts-ignore
      window.document.addEventListener(
        'blur',
        () => {
          this.focus = false;
        },
        true
      );
    }
  }
  public get isFocused() {
    return this.focus;
  }
}

// Check if we're in a React Native environment (no document) or webview (has document)
// This handles Expo, bare React Native with old/new architecture, and web environments
const isReactNativeContext = isExpo() || !hasDocument();
const shimmedFocusListener = { isFocused: false };

export const focusListener = isReactNativeContext
  ? shimmedFocusListener
  : new FocusListener();

package com.tentap;

/** Pure geometry used by {@link TenTapKeyboardModule}. All values are in pixels. */
final class KeyboardGeometry {
  /** Same threshold React Native uses to tell a keyboard from system bars. */
  static final float MIN_KEYBOARD_HEIGHT_DP = 60f;

  private KeyboardGeometry() {}

  /**
   * How much of the bottom navigation bar covers the content view. This is the
   * full bar height when the app draws edge-to-edge and 0 when the window
   * already keeps its content above the bar.
   */
  static int navigationBarOverlap(int contentBottom, int windowBottom, int navigationBarHeight) {
    if (navigationBarHeight <= 0) {
      return 0;
    }
    int navigationBarTop = windowBottom - navigationBarHeight;
    return Math.max(0, Math.min(navigationBarHeight, contentBottom - navigationBarTop));
  }

  /**
   * Pre-API 30 IME detection: the visible display frame ends well above the
   * window bottom once the navigation bar is accounted for.
   */
  static boolean isKeyboardCoveringFrame(
      int windowBottom, int visibleBottom, int navigationBarHeight, int minKeyboardHeight) {
    return windowBottom - visibleBottom - navigationBarHeight >= minKeyboardHeight;
  }
}

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

  /** Keyboard height tracked while the IME is hidden. */
  static final int HIDDEN = Integer.MIN_VALUE;

  /**
   * The keyboard height React Native has reported after a layout that found
   * the IME shown with {@code height} (bottom inset minus the system bars),
   * given the one reported before ({@link #HIDDEN} while it was hidden). React
   * Native reports the height of the first layout that shows the IME, and the
   * module reports every later positive change; a height of 0 or less shows
   * nothing.
   */
  static int reportedKeyboardHeight(int previousHeight, int height) {
    if (height > 0) {
      return height;
    }
    return previousHeight == HIDDEN ? 0 : previousHeight;
  }

  /**
   * Whether a shown keyboard now has a height React Native did not report:
   * it changed size (the emoji panel, a suggestion strip), or React Native
   * saw it open while its insets were still empty.
   */
  static boolean isUnreportedKeyboardHeight(int previousHeight, int height) {
    return previousHeight != HIDDEN && height > 0 && previousHeight != height;
  }
}

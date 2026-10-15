package com.tentap;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class KeyboardGeometryTest {
  private static final int WINDOW_BOTTOM = 2400;
  private static final int NAV_BAR = 126;
  private static final int MIN_KEYBOARD = 165;

  @Test
  public void edgeToEdgeContentIsCoveredByTheWholeBar() {
    assertEquals(
        NAV_BAR, KeyboardGeometry.navigationBarOverlap(WINDOW_BOTTOM, WINDOW_BOTTOM, NAV_BAR));
  }

  @Test
  public void contentAboveTheBarIsNotCovered() {
    assertEquals(
        0, KeyboardGeometry.navigationBarOverlap(WINDOW_BOTTOM - NAV_BAR, WINDOW_BOTTOM, NAV_BAR));
  }

  @Test
  public void contentResizedAboveTheKeyboardIsNotCovered() {
    assertEquals(0, KeyboardGeometry.navigationBarOverlap(1500, WINDOW_BOTTOM, NAV_BAR));
  }

  @Test
  public void partialOverlapIsReported() {
    assertEquals(
        40,
        KeyboardGeometry.navigationBarOverlap(
            WINDOW_BOTTOM - NAV_BAR + 40, WINDOW_BOTTOM, NAV_BAR));
  }

  @Test
  public void hiddenOrSideNavigationBarGivesNoOverlap() {
    assertEquals(0, KeyboardGeometry.navigationBarOverlap(WINDOW_BOTTOM, WINDOW_BOTTOM, 0));
  }

  @Test
  public void navigationBarAloneIsNotAKeyboard() {
    assertFalse(
        KeyboardGeometry.isKeyboardCoveringFrame(
            WINDOW_BOTTOM, WINDOW_BOTTOM - NAV_BAR, NAV_BAR, MIN_KEYBOARD));
  }

  @Test
  public void keyboardAboveTheNavigationBarIsDetected() {
    assertTrue(
        KeyboardGeometry.isKeyboardCoveringFrame(
            WINDOW_BOTTOM, WINDOW_BOTTOM - NAV_BAR - 800, NAV_BAR, MIN_KEYBOARD));
  }

  @Test
  public void obstructionsBelowTheThresholdAreIgnored() {
    assertFalse(
        KeyboardGeometry.isKeyboardCoveringFrame(
            WINDOW_BOTTOM, WINDOW_BOTTOM - NAV_BAR - 100, NAV_BAR, MIN_KEYBOARD));
  }

  @Test
  public void aShownKeyboardChangingHeightIsReported() {
    assertTrue(KeyboardGeometry.isUnreportedKeyboardHeight(767, 949));
    assertFalse(KeyboardGeometry.isUnreportedKeyboardHeight(767, 767));
    assertFalse(KeyboardGeometry.isUnreportedKeyboardHeight(767, -66));
  }

  @Test
  public void reactNativeReportsTheKeyboardThatOpensWithAHeight() {
    assertFalse(KeyboardGeometry.isUnreportedKeyboardHeight(KeyboardGeometry.HIDDEN, 767));
    assertEquals(767, KeyboardGeometry.reportedKeyboardHeight(KeyboardGeometry.HIDDEN, 767));
  }

  @Test
  public void aKeyboardThatOpensWithEmptyInsetsIsReportedOnceItHasAHeight() {
    // React Native sees the IME shown while its bottom inset is still 0.
    int opened = KeyboardGeometry.reportedKeyboardHeight(KeyboardGeometry.HIDDEN, -66);
    assertEquals(0, opened);
    assertTrue(KeyboardGeometry.isUnreportedKeyboardHeight(opened, 617));
    int reported = KeyboardGeometry.reportedKeyboardHeight(opened, 617);
    // An empty frame in between does not report the same height again.
    int between = KeyboardGeometry.reportedKeyboardHeight(reported, -66);
    assertEquals(617, between);
    assertFalse(KeyboardGeometry.isUnreportedKeyboardHeight(between, 617));
  }
}

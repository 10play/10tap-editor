import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  View,
  type LayoutChangeEvent,
  type ViewProps,
} from 'react-native';
import { useKeyboard } from '../../utils/useKeyboard';
import { measureViewGeometry } from '../keyboardAccessories';
import { COVER_MEASURE_DELAYS_MS } from '../useKeyboardCover';

export interface EditorKeyboardAvoidingViewProps extends ViewProps {
  /**
   * Distance in dp between the bottom of this view and the bottom of the
   * window. Only used until the view was measured.
   */
  keyboardVerticalOffset?: number;
  enabled?: boolean;
}

export interface KeyboardAvoidingPaddingInput {
  /** Bottom of the view in window coordinates, null until measured. */
  viewBottom: number | null;
  /** `useKeyboard().keyboardTop`. */
  keyboardTop: number | null;
  keyboardCoverHeight: number;
  inlineKeyboardHeight: number;
  keyboardVerticalOffset: number;
  /** Height of the screen, which no keyboard reaches below. */
  screenHeight: number;
}

/**
 * Bottom padding that ends the content of a view on top of the keyboard:
 * how far the keyboard reaches up into the view, both measured in the
 * window. A view the window already shrank for the keyboard needs none. An
 * inline `CustomKeyboard` inside the view takes its own space. Until both
 * positions are known it falls back to the keyboard's cover height minus
 * `keyboardVerticalOffset`. Never more than the keyboard covers of the
 * screen, so a view that grows with its padding cannot feed back.
 */
export const getKeyboardAvoidingPadding = ({
  viewBottom,
  keyboardTop,
  keyboardCoverHeight,
  inlineKeyboardHeight,
  keyboardVerticalOffset,
  screenHeight,
}: KeyboardAvoidingPaddingInput): number => {
  const cover =
    viewBottom !== null && keyboardTop !== null
      ? Math.min(viewBottom, screenHeight) - keyboardTop
      : keyboardCoverHeight - keyboardVerticalOffset;
  return Math.max(0, Math.round(cover - inlineKeyboardHeight));
};

/** Where the view ended in the window, and under which keyboard. */
export interface MeasuredViewBottom {
  bottom: number;
  keyboardTop: number | null;
  /**
   * The keyboard covered the window when measured (`keyboardCoverHeight >
   * 0`): a custom keyboard, or any keyboard where the window overlays it.
   * Left out, the measurement counts under either.
   */
  covered?: boolean;
}

/**
 * The measured bottom of the view while it still holds, else null. Where the
 * keyboard covers the window the view stays, whichever keyboard is up. A
 * window that resizes for the system keyboard (it covers nothing) moves the
 * view when the keyboard moves, so a bottom measured under another keyboard
 * top is stale until measured again. So is one measured while a keyboard
 * covered the window, such as a custom keyboard handing over to a system
 * keyboard that ends at the same top: the window shrinks under the view.
 * Padding by a stale bottom would push the content above up by the
 * keyboard's height for a frame, squeezing it to nothing, and Android takes
 * focus from a view laid out with no height.
 */
export const getCurrentViewBottom = (
  measured: MeasuredViewBottom | null,
  keyboardTop: number | null,
  keyboardCoverHeight: number
): number | null => {
  if (measured === null) return null;
  if (keyboardCoverHeight > 0) {
    return measured.covered === false ? null : measured.bottom;
  }
  return measured.covered !== true && measured.keyboardTop === keyboardTop
    ? measured.bottom
    : null;
};

/**
 * How long a measurement that disagrees with how the window resizes must
 * hold before it counts: the resized layout can land a few frames after the
 * keyboard event.
 */
export const RESIZE_SETTLE_MS = 150;

/** A measurement, and since when the measurements have agreed with it. */
export interface PendingMeasurement {
  measured: MeasuredViewBottom;
  since: number;
}

/**
 * Whether a new measurement applies. A window that overlays keyboards never
 * moves the view, so all of them do. One that resizes for the system
 * keyboard (Android `adjustResize`) shrinks as that keyboard shows, after
 * Android reported it, and grows back as a custom keyboard takes its place:
 * a view measured before the resized layout landed ends below the system
 * keyboard's top, or above the custom keyboard's. Such a measurement counts
 * only once the measurements agreed for `RESIZE_SETTLE_MS`, as where
 * `adjustResize` does not take effect or the view ends above the keyboard.
 */
export const isSettledMeasurement = (
  next: MeasuredViewBottom,
  pending: PendingMeasurement | null,
  now: number,
  windowResizes: boolean
): boolean => {
  if (!windowResizes || next.keyboardTop === null) return true;
  const reachesKeyboard = next.bottom > next.keyboardTop + 1;
  if (reachesKeyboard === (next.covered ?? false)) return true;
  return (
    pending !== null &&
    isSameMeasurement(next, pending.measured) &&
    now - pending.since >= RESIZE_SETTLE_MS
  );
};

export const isSameMeasurement = (
  a: MeasuredViewBottom,
  b: MeasuredViewBottom | null
) =>
  b !== null &&
  a.keyboardTop === b.keyboardTop &&
  a.covered === b.covered &&
  Math.abs(a.bottom - b.bottom) < 1;

/**
 * Pads its bottom by the part of it whichever keyboard covers, system or
 * custom, so the toolbar at its bottom sits fully on top of the keyboard.
 * It measures where it ends in the window against the keyboard's top
 * (`useKeyboard().keyboardTop`), so it works below a header, above a tab
 * bar, on edge-to-edge Android and where the window resizes for the
 * keyboard, without a `keyboardVerticalOffset`. The padding holds through
 * swaps, so content above does not move when a `CustomKeyboard` replaces
 * the system keyboard. An inline `CustomKeyboard` inside it takes its own
 * space, so the padding leaves that out.
 */
export const EditorKeyboardAvoidingView = ({
  keyboardVerticalOffset = 0,
  enabled = true,
  style,
  onLayout,
  ...props
}: EditorKeyboardAvoidingViewProps) => {
  const {
    keyboardTop,
    keyboardCoverHeight,
    inlineKeyboardHeight,
    windowOverlaysKeyboard,
  } = useKeyboard();
  const ref = useRef<View>(null);
  const [measured, setMeasured] = useState<MeasuredViewBottom | null>(null);
  // The last measurement, settled or not.
  const lastMeasured = useRef<PendingMeasurement | null>(null);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const active = enabled && keyboardTop !== null;
  const covered = keyboardCoverHeight > 0;

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (ref.current) measureViewGeometry(ref.current);
      setLayoutVersion((version) => version + 1);
      onLayout?.(event);
    },
    [onLayout]
  );

  useEffect(() => {
    if (!active) {
      // The window grows back as the keyboard hides, which can be measured
      // before the hide is reported, under the old keyboard top: such a
      // bottom would pad the next show of that keyboard.
      lastMeasured.current = null;
      setMeasured((previous) =>
        previous?.covered === false ? null : previous
      );
      return;
    }
    let cancelled = false;
    const measure = () =>
      ref.current?.measureInWindow((_x, y, _width, height) => {
        if (cancelled || !Number.isFinite(y) || height <= 0) return;
        const bottom = y + height;
        const next = { bottom, keyboardTop, covered };
        const now = Date.now();
        const pending = lastMeasured.current;
        const settled = isSettledMeasurement(
          next,
          pending,
          now,
          !windowOverlaysKeyboard
        );
        if (pending === null || !isSameMeasurement(next, pending.measured)) {
          lastMeasured.current = { measured: next, since: now };
        }
        if (!settled) return;
        setMeasured((previous) =>
          isSameMeasurement(next, previous) ? previous : next
        );
      });
    measure();
    // The window resizes and keyboards animate after the keyboard event.
    const timers = COVER_MEASURE_DELAYS_MS.map((ms) => setTimeout(measure, ms));
    return () => {
      cancelled = true;
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [active, covered, keyboardTop, layoutVersion, windowOverlaysKeyboard]);

  const paddingBottom = enabled
    ? getKeyboardAvoidingPadding({
        viewBottom: getCurrentViewBottom(
          measured,
          keyboardTop,
          keyboardCoverHeight
        ),
        keyboardTop,
        keyboardCoverHeight,
        inlineKeyboardHeight,
        keyboardVerticalOffset,
        screenHeight: Dimensions.get('screen').height,
      })
    : 0;
  return (
    <View
      ref={ref}
      style={[style, { paddingBottom }]}
      onLayout={handleLayout}
      {...props}
    />
  );
};

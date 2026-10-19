import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
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
 * Where the view sat on the keyboard: the `top` in its parent at which its
 * content ended on `keyboardTop`, in a window of this size.
 */
export interface KeyboardAnchor {
  top: number;
  keyboardTop: number;
  windowWidth: number;
  windowHeight: number;
}

/**
 * How long the view stays anchored after a custom keyboard closed, at most,
 * waiting for a layout that sits on the keyboard again.
 */
export const ANCHOR_HOLD_MS = 1000;

/**
 * Whether the view is placed by its bottom alone: absolutely positioned
 * with a `bottom` and no `top` or `height`, its content laid out from the
 * top. Such a view can be anchored by its top instead without moving.
 */
export const isBottomAnchoredStyle = (style: StyleProp<ViewStyle>): boolean => {
  const flat = StyleSheet.flatten(style) ?? {};
  const unset = (value: unknown) => value === undefined || value === null;
  return (
    flat.position === 'absolute' &&
    !unset(flat.bottom) &&
    unset(flat.top) &&
    unset(flat.inset) &&
    unset(flat.insetBlock) &&
    unset(flat.insetBlockStart) &&
    unset(flat.height) &&
    (unset(flat.flexDirection) || flat.flexDirection === 'column') &&
    (unset(flat.justifyContent) || flat.justifyContent === 'flex-start')
  );
};

export interface SitsOnKeyboardInput {
  /** Measured bottom of the view in window coordinates. */
  viewBottom: number;
  paddingBottom: number;
  inlineKeyboardHeight: number;
  keyboardTop: number | null;
}

/**
 * Whether the content of the view (above its padding and an inline
 * keyboard) ends on the keyboard: a layout that the keyboard's current
 * position already landed in.
 */
export const sitsOnKeyboard = ({
  viewBottom,
  paddingBottom,
  inlineKeyboardHeight,
  keyboardTop,
}: SitsOnKeyboardInput): boolean =>
  keyboardTop !== null &&
  Math.abs(viewBottom - paddingBottom - inlineKeyboardHeight - keyboardTop) < 1;

/**
 * `top` that keeps the content of an anchored view ending on the keyboard:
 * where it sat on it, moved by how far the keyboard's top moved since.
 * Undefined without an anchor from this window size or a keyboard.
 */
export const getAnchoredTop = (
  anchor: KeyboardAnchor | null,
  keyboardTop: number | null,
  window: { width: number; height: number }
): number | undefined => {
  if (anchor === null || keyboardTop === null) return undefined;
  if (
    Math.abs(anchor.windowWidth - window.width) >= 1 ||
    Math.abs(anchor.windowHeight - window.height) >= 1
  ) {
    return undefined;
  }
  return anchor.top + keyboardTop - anchor.keyboardTop;
};

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
 *
 * Where the window resizes for the system keyboard (Android
 * `adjustResize`), a swap between a custom keyboard and the system keyboard
 * resizes the window too. React Native applies the new window size in a
 * commit of its own, which can be drawn a frame or more before or after the
 * keyboard area changes, moving the toolbar off the keyboard for those
 * frames. While a custom keyboard is open, until the view sits on the
 * keyboard again after it closed, a view placed by its bottom alone is
 * placed by its top instead, where it already is, so the toolbar stays put
 * whichever lands first.
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
    isCustomKeyboardOpen,
  } = useKeyboard();
  const windowSize = useWindowDimensions();
  const ref = useRef<View>(null);
  // `onLayout` y: the top of the view in its parent.
  const layoutTop = useRef<number | null>(null);
  const [anchor, setAnchor] = useState<KeyboardAnchor | null>(null);
  // Anchored after the custom keyboard closed, until it sits on the keyboard.
  const [holding, setHolding] = useState(false);
  // What the last render laid out, for measurements taken after it.
  const rendered = useRef({
    paddingBottom: 0,
    inlineKeyboardHeight,
    isCustomKeyboardOpen,
    windowSize,
  });
  const bottomAnchored = useMemo(() => isBottomAnchoredStyle(style), [style]);
  const anchorable =
    Platform.OS === 'android' &&
    enabled &&
    !windowOverlaysKeyboard &&
    bottomAnchored;
  const anchoredTop =
    anchorable && (isCustomKeyboardOpen || holding)
      ? getAnchoredTop(anchor, keyboardTop, windowSize)
      : undefined;
  const [measured, setMeasured] = useState<MeasuredViewBottom | null>(null);
  // The last measurement, settled or not.
  const lastMeasured = useRef<PendingMeasurement | null>(null);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const active = enabled && keyboardTop !== null;
  const covered = keyboardCoverHeight > 0;

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      layoutTop.current = event.nativeEvent.layout.y;
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
        const latest = rendered.current;
        const top = layoutTop.current;
        // Content ends on the keyboard, or the window itself shrank onto it.
        // The padding still applied is from the previous layout: after a
        // custom keyboard closes it can be the whole keyboard, which would
        // hide that the shrunk window is already in place.
        const windowShrunkOntoKeyboard =
          !latest.isCustomKeyboardOpen && Math.abs(bottom - keyboardTop) < 1;
        if (
          top !== null &&
          (sitsOnKeyboard({
            viewBottom: bottom,
            paddingBottom: latest.paddingBottom,
            inlineKeyboardHeight: latest.inlineKeyboardHeight,
            keyboardTop,
          }) ||
            windowShrunkOntoKeyboard)
        ) {
          const { width: windowWidth, height: windowHeight } =
            latest.windowSize;
          setAnchor((previous) =>
            previous !== null &&
            previous.keyboardTop === keyboardTop &&
            Math.abs(previous.top - top) < 0.5 &&
            previous.windowWidth === windowWidth &&
            previous.windowHeight === windowHeight
              ? previous
              : { top, keyboardTop, windowWidth, windowHeight }
          );
          if (!latest.isCustomKeyboardOpen) setHolding(false);
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

  // Anchored while a custom keyboard is open, and held after it closed
  // until a layout sits on the keyboard again.
  useEffect(() => {
    if (keyboardTop === null) {
      setHolding(false);
      return;
    }
    if (isCustomKeyboardOpen) {
      if (anchoredTop !== undefined) setHolding(true);
      return;
    }
    if (!holding) return;
    const timer = setTimeout(() => setHolding(false), ANCHOR_HOLD_MS);
    return () => clearTimeout(timer);
  }, [anchoredTop, holding, isCustomKeyboardOpen, keyboardTop]);

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
  useLayoutEffect(() => {
    rendered.current = {
      paddingBottom,
      inlineKeyboardHeight,
      isCustomKeyboardOpen,
      windowSize,
    };
  });
  return (
    <View
      ref={ref}
      style={[
        style,
        { paddingBottom },
        anchoredTop !== undefined && { top: anchoredTop },
      ]}
      onLayout={handleLayout}
      {...props}
    />
  );
};

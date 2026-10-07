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
  const { keyboardTop, keyboardCoverHeight, inlineKeyboardHeight } =
    useKeyboard();
  const ref = useRef<View>(null);
  const [viewBottom, setViewBottom] = useState<number | null>(null);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const active = enabled && keyboardTop !== null;

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (ref.current) measureViewGeometry(ref.current);
      setLayoutVersion((version) => version + 1);
      onLayout?.(event);
    },
    [onLayout]
  );

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const measure = () =>
      ref.current?.measureInWindow((_x, y, _width, height) => {
        if (cancelled || !Number.isFinite(y) || height <= 0) return;
        setViewBottom((previous) =>
          previous !== null && Math.abs(previous - (y + height)) < 1
            ? previous
            : y + height
        );
      });
    measure();
    // The window resizes and keyboards animate after the keyboard event.
    const timers = COVER_MEASURE_DELAYS_MS.map((ms) => setTimeout(measure, ms));
    return () => {
      cancelled = true;
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [active, keyboardTop, layoutVersion]);

  const paddingBottom = enabled
    ? getKeyboardAvoidingPadding({
        viewBottom,
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

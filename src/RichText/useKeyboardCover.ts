import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, type LayoutChangeEvent } from 'react-native';
import {
  editorViews,
  isMeasurableView,
  keyboardAccessories,
  measureFrame,
  type MeasurableView,
} from './keyboardAccessories';
import { getCoverOverlap } from './utils';

/**
 * Delays after a change at which the editor is measured again: layout lands
 * in the next frames, Android resizes the window after its keyboard event,
 * and keyboard animations end within about 300 ms.
 */
export const COVER_MEASURE_DELAYS_MS = [16, 250, 600];

/**
 * How far the keyboard and the views drawn on it (the `Toolbar`) reach up
 * into the editor, in dp, measured in the window. Negative when they end
 * below it, null until the editor was measured with the keyboard up.
 * `pending` holds off the unmeasured fallback inset for the few frames the
 * measurement takes, so the caret is not scrolled twice.
 */
export const useKeyboardCover = (
  controller: object,
  enabled: boolean,
  isKeyboardUp: boolean,
  keyboardCoverHeight: number
): {
  overlap: number | null;
  /** The keyboard is up and the editor is about to be measured. */
  pending: boolean;
  onLayout: (event: LayoutChangeEvent) => void;
} => {
  const editorView = useRef<MeasurableView | null>(null);
  const [overlap, setOverlap] = useState<number | null>(null);
  // The last measurement after a change ran, whatever it found.
  const [settled, setSettled] = useState(false);
  const [measurable, setMeasurable] = useState(false);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [accessoryVersion, setAccessoryVersion] = useState(0);
  const active = enabled && isKeyboardUp;

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const target: unknown = event.currentTarget;
      if (isMeasurableView(target)) {
        editorView.current = target;
        editorViews.set(controller, target);
        setMeasurable(true);
      }
      setLayoutVersion((version) => version + 1);
    },
    [controller]
  );

  useEffect(
    () =>
      keyboardAccessories.subscribe(() =>
        setAccessoryVersion((version) => version + 1)
      ),
    []
  );

  useEffect(() => {
    if (!active) {
      setOverlap(null);
      setSettled(false);
      return;
    }
    let cancelled = false;
    const measure = async (last: boolean) => {
      const view = editorView.current;
      if (last) setSettled(true);
      if (!view) return;
      const [editor, ...accessories] = await Promise.all([
        measureFrame(view),
        ...keyboardAccessories.getViews().map(measureFrame),
      ]);
      if (cancelled || !editor) return;
      const keyboardTop =
        keyboardCoverHeight > 0
          ? Dimensions.get('window').height - keyboardCoverHeight
          : null;
      const next = getCoverOverlap(
        editor,
        accessories.filter((frame) => frame !== null),
        keyboardTop
      );
      setOverlap((previous) =>
        previous !== null && Math.abs(previous - next) < 1 ? previous : next
      );
    };
    const timers = COVER_MEASURE_DELAYS_MS.map((ms, index) =>
      setTimeout(
        () => void measure(index === COVER_MEASURE_DELAYS_MS.length - 1),
        ms
      )
    );
    const dimensions = Dimensions.addEventListener('change', () => {
      timers.push(
        setTimeout(() => void measure(false), COVER_MEASURE_DELAYS_MS[1])
      );
    });
    return () => {
      cancelled = true;
      timers.forEach((timer) => clearTimeout(timer));
      dimensions.remove();
    };
  }, [active, keyboardCoverHeight, layoutVersion, accessoryVersion]);

  return {
    overlap: active ? overlap : null,
    pending: active && measurable && overlap === null && !settled,
    onLayout,
  };
};

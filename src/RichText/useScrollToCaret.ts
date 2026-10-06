import { useEffect, useRef, type RefObject } from 'react';
import { Dimensions } from 'react-native';
import { PROTOCOL_TYPES } from '../shared/protocol';
import { getEditorController } from '../shared/contracts';
import type { EditorBridge } from '../types';
import { useKeyboard } from '../utils/useKeyboard';
import {
  editorViews,
  isMeasurableView,
  keyboardAccessories,
  measureFrame,
} from './keyboardAccessories';
import { CARET_MARGIN, getCaretScroll, type CoverFrame } from './utils';
import { COVER_MEASURE_DELAYS_MS } from './useKeyboardCover';

/** The parts of a `ScrollView` the hook uses. */
export interface CaretScrollView {
  scrollTo(options: { y: number; animated?: boolean }): void;
  getNativeScrollRef?(): unknown;
  getInnerViewRef?(): unknown;
}

interface Caret {
  top: number;
  bottom: number;
}

const isCaret = (value: unknown): value is Caret =>
  typeof value === 'object' &&
  value !== null &&
  Number.isFinite((value as Caret).top) &&
  Number.isFinite((value as Caret).bottom);

const measureMaybe = (view: unknown): Promise<CoverFrame | null> =>
  isMeasurableView(view) ? measureFrame(view) : Promise.resolve(null);

/**
 * Keeps the caret of a `dynamicHeight` editor visible inside the
 * `ScrollView` it grows in: the editor does not scroll itself, so the
 * `ScrollView` is scrolled to keep the line being typed `CARET_MARGIN` clear
 * of the keyboard, the toolbar on it and the `ScrollView`'s own edges.
 */
export const useScrollToCaret = (
  editor: EditorBridge,
  scrollViewRef: RefObject<CaretScrollView | null>
): void => {
  const { isKeyboardUp, keyboardCoverHeight } = useKeyboard();
  const caret = useRef<Caret | null>(null);
  const reveal = useRef<() => void>(() => {});

  reveal.current = () => {
    const controller = getEditorController(editor);
    const scrollView = scrollViewRef.current;
    const editorView = controller && editorViews.get(controller);
    const rect = caret.current;
    if (!scrollView || !editorView || !rect || !isKeyboardUp) return;
    void Promise.all([
      measureFrame(editorView),
      measureMaybe(scrollView.getNativeScrollRef?.() ?? scrollView),
      measureMaybe(scrollView.getInnerViewRef?.()),
      ...keyboardAccessories.getViews().map(measureFrame),
    ]).then(([editorFrame, viewport, content, ...accessories]) => {
      if (!editorFrame || !viewport || !content) return;
      const keyboardTop =
        keyboardCoverHeight > 0
          ? Dimensions.get('window').height - keyboardCoverHeight
          : Infinity;
      let visibleBottom = Math.min(viewport.bottom, keyboardTop);
      for (const accessory of accessories) {
        if (accessory && accessory.top > viewport.top) {
          visibleBottom = Math.min(visibleBottom, accessory.top);
        }
      }
      const y = getCaretScroll({
        caret: {
          top: editorFrame.top + rect.top,
          bottom: editorFrame.top + rect.bottom,
        },
        visible: { top: viewport.top, bottom: visibleBottom },
        scrollOffset: viewport.top - content.top,
        margin: CARET_MARGIN,
      });
      if (y !== null) scrollView.scrollTo({ y, animated: false });
    });
  };

  useEffect(() => {
    const controller = getEditorController(editor);
    if (!controller) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const revealSoon = () => {
      reveal.current();
      // The WebView grows to the new content after the caret moved.
      timers.push(
        setTimeout(() => reveal.current(), COVER_MEASURE_DELAYS_MS[1])
      );
    };
    const unsubscribeCaret = controller.subscribeMessage(
      PROTOCOL_TYPES.CaretRect,
      (rect) => {
        if (!isCaret(rect)) return;
        caret.current = rect;
        revealSoon();
      }
    );
    const unsubscribeHeight = controller.subscribeHeight(() => revealSoon());
    return () => {
      unsubscribeCaret();
      unsubscribeHeight();
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [editor]);

  // The keyboard came up or changed size over the caret.
  useEffect(() => {
    if (!isKeyboardUp) return;
    const timers = COVER_MEASURE_DELAYS_MS.map((ms) =>
      setTimeout(() => reveal.current(), ms)
    );
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [isKeyboardUp, keyboardCoverHeight]);
};

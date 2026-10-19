import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, type LayoutChangeEvent } from 'react-native';
import type { Listener, Unsubscribe } from '../shared/contracts';
import { keyboardStore } from '../native/keyboardStore';

/** A mounted view whose window frame can be read, like a host component. */
export interface MeasurableView {
  measureInWindow(
    callback: (x: number, y: number, width: number, height: number) => void
  ): void;
  measure?(
    callback: (
      x: number,
      y: number,
      width: number,
      height: number,
      pageX: number,
      pageY: number
    ) => void
  ): void;
}

export interface WindowFrame {
  top: number;
  bottom: number;
}

/**
 * Views drawn over the bottom of the editor while the keyboard is up, such
 * as the `Toolbar` sitting on the keyboard. `RichText` keeps the caret above
 * the top of every one that overlaps it.
 */
export interface KeyboardAccessoryRegistry {
  /** Adds or moves `view`; listeners hear about it either way. */
  set(key: object, view: MeasurableView | null): void;
  getViews(): MeasurableView[];
  subscribe(listener: Listener<void>): Unsubscribe;
}

export function createKeyboardAccessoryRegistry(): KeyboardAccessoryRegistry {
  const views = new Map<object, MeasurableView>();
  const listeners = new Set<Listener<void>>();
  return {
    set(key, view) {
      if (view) views.set(key, view);
      else if (!views.delete(key)) return;
      listeners.forEach((listener) => listener());
    },
    getViews: () => [...views.values()],
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const keyboardAccessories = createKeyboardAccessoryRegistry();

/** The mounted WebView of each editor controller, for `useScrollToCaret`. */
export const editorViews = new WeakMap<object, MeasurableView>();

export const isMeasurableView = (value: unknown): value is MeasurableView =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Partial<MeasurableView>).measureInWindow === 'function';

/** A view that unmounted may never answer. */
const MEASURE_TIMEOUT_MS = 500;

/** The window frame of `view`, or null when it is not laid out. */
export const measureFrame = (
  view: MeasurableView
): Promise<WindowFrame | null> =>
  new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), MEASURE_TIMEOUT_MS);
    try {
      view.measureInWindow((_x, y, _width, height) => {
        clearTimeout(timer);
        resolve(
          Number.isFinite(y) && height > 0
            ? { top: y, bottom: y + height }
            : null
        );
      });
    } catch {
      clearTimeout(timer);
      resolve(null);
    }
  });

/**
 * Reports where `view` sits in the window and in its root view, which tells
 * the keyboard store how window coordinates lie on the screen.
 */
export const measureViewGeometry = (view: MeasurableView): void => {
  if (Platform.OS !== 'android' || !view.measure) return;
  try {
    view.measure((_x, _y, _width, height, _pageX, pageY) =>
      view.measureInWindow((_wx, windowY) =>
        keyboardStore.reportViewGeometry({ windowY, pageY, height })
      )
    );
  } catch {
    // Not laid out.
  }
};

/**
 * Marks a view drawn over the bottom of the editor while the keyboard is up,
 * such as a custom toolbar on the keyboard: `RichText` keeps the caret above
 * its top. Pass the returned `onLayout` to the view. `Toolbar` does this
 * itself.
 */
export const useKeyboardAccessory = (
  enabled = true
): { onLayout: (event: LayoutChangeEvent) => void } => {
  const key = useRef({}).current;
  const [view, setView] = useState<MeasurableView | null>(null);
  const active = enabled && Platform.OS !== 'web';
  useEffect(() => {
    keyboardAccessories.set(key, active ? view : null);
    return () => keyboardAccessories.set(key, null);
  }, [key, active, view]);
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const target: unknown = event.currentTarget;
      if (!isMeasurableView(target)) return;
      setView(target);
      // A view that moved is measured again.
      if (active) keyboardAccessories.set(key, target);
    },
    [key, active]
  );
  return { onLayout };
};

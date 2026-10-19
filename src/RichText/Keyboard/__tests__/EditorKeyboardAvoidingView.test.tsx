import React from 'react';
import {
  Platform,
  StyleSheet,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import type { KeyboardState } from '../../../native/keyboardStore';
import { useKeyboard } from '../../../utils/useKeyboard';
import {
  ANCHOR_HOLD_MS,
  EditorKeyboardAvoidingView,
  getAnchoredTop,
  isBottomAnchoredStyle,
  sitsOnKeyboard,
} from '../EditorKeyboardAvoidingView';

jest.mock('../../../utils/useKeyboard', () => ({ useKeyboard: jest.fn() }));

const mockUseKeyboard = jest.mocked(useKeyboard);

/**
 * A cold start on Android with `adjustResize` (Galaxy Note 9 shaped, in dp):
 * the window ends at 568 without the system keyboard and at 319 with it, the
 * keyboard's top is 319 whichever keyboard is up, and the toolbar (44) sits
 * on it. React Native applies a new window size in a commit of its own,
 * which can land frames before or after the keyboard area changes.
 */
const KEYBOARD_TOP = 319;
const FULL_WINDOW = 568;
const TOOLBAR = 44;
const KEYBOARD = FULL_WINDOW - KEYBOARD_TOP;
const TOOLBAR_TOP = KEYBOARD_TOP - TOOLBAR;

const keyboardDown: KeyboardState = {
  isKeyboardUp: false,
  keyboardHeight: 0,
  isCustomKeyboardOpen: false,
  activeCustomKeyboardID: undefined,
  systemKeyboardHeight: 0,
  lastKeyboardHeight: 0,
  windowOverlaysKeyboard: false,
  keyboardCoverHeight: 0,
  inlineKeyboardHeight: 0,
  keyboardTop: null,
};

const systemUp: KeyboardState = {
  ...keyboardDown,
  isKeyboardUp: true,
  keyboardHeight: KEYBOARD,
  systemKeyboardHeight: KEYBOARD,
  lastKeyboardHeight: KEYBOARD,
  keyboardTop: KEYBOARD_TOP,
};

/** The custom keyboard is opening: the system keyboard is still up. */
const customOpening: KeyboardState = {
  ...systemUp,
  isCustomKeyboardOpen: true,
  activeCustomKeyboardID: 'colors',
};

/** The custom keyboard is open in its inline slot. */
const customOpen: KeyboardState = {
  ...customOpening,
  systemKeyboardHeight: 0,
  keyboardCoverHeight: KEYBOARD,
  inlineKeyboardHeight: KEYBOARD,
};

const bottomBar: ViewStyle = {
  position: 'absolute',
  width: '100%',
  bottom: 0,
};

let state: KeyboardState = keyboardDown;
let frame = { y: 0, height: 0 };

const setKeyboard = (next: KeyboardState) => {
  state = next;
  screen.rerender(
    <EditorKeyboardAvoidingView testID="avoider" style={bottomBar} />
  );
};

const view = () => screen.getByTestId('avoider');
const top = () => StyleSheet.flatten(view().props.style).top;

/** The mock `View` class instance the avoiding view keeps in its ref. */
const host = () => {
  const instance = view().parent?.instance;
  if (instance == null) {
    throw new Error('EditorKeyboardAvoidingView host instance is missing');
  }
  return instance;
};

/** Lays the view out at `y` in its parent, ending at `bottom` in the window. */
const layOut = (y: number, bottom: number) => {
  frame = { y, height: bottom - y };
  act(() => {
    view().props.onLayout({
      nativeEvent: { layout: { x: 0, y, width: 320, height: bottom - y } },
    } as LayoutChangeEvent);
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.replaceProperty(Platform, 'OS', 'android');
  state = keyboardDown;
  frame = { y: 0, height: 0 };
  mockUseKeyboard.mockImplementation(() => state);
  render(<EditorKeyboardAvoidingView testID="avoider" style={bottomBar} />);
  // Host elements have no instance under React 19. The ref points at the
  // parent mock class, which is what `measureInWindow` is called on.
  host().measureInWindow = (
    callback: (x: number, y: number, width: number, height: number) => void
  ) => callback(0, frame.y, 320, frame.height);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

/** The editor autofocused: the system keyboard is up and the window shrank. */
const systemKeyboardShown = () => {
  setKeyboard(systemUp);
  layOut(TOOLBAR_TOP, KEYBOARD_TOP);
};

describe('EditorKeyboardAvoidingView on a cold start (Android adjustResize)', () => {
  it('stays placed by its bottom while only the system keyboard is up', () => {
    systemKeyboardShown();
    expect(top()).toBeUndefined();
  });

  it('keeps the toolbar on the keyboard when the window grows before the custom keyboard takes its slot', () => {
    systemKeyboardShown();
    setKeyboard(customOpening);
    // Anchored where it already is: nothing moves.
    expect(top()).toBe(TOOLBAR_TOP);
    // The system keyboard hid; the window grows back in a later commit.
    setKeyboard({ ...customOpen, inlineKeyboardHeight: 0 });
    expect(top()).toBe(TOOLBAR_TOP);
    layOut(TOOLBAR_TOP, FULL_WINDOW);
    setKeyboard(customOpen);
    expect(top()).toBe(TOOLBAR_TOP);
  });

  it('keeps the toolbar on the keyboard when the slot empties before the window shrinks on close', () => {
    systemKeyboardShown();
    setKeyboard(customOpening);
    setKeyboard(customOpen);
    layOut(TOOLBAR_TOP, FULL_WINDOW);
    // First close: the system keyboard took over and the slot emptied, but
    // the window still has its full height. Placed by its bottom, the
    // toolbar would end at the bottom of the window, under the keyboard.
    setKeyboard(systemUp);
    expect(top()).toBe(TOOLBAR_TOP);
    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(top()).toBe(TOOLBAR_TOP);
    // The window shrank: the view sits on the keyboard again and is placed
    // by its bottom, at the same place.
    layOut(TOOLBAR_TOP, KEYBOARD_TOP);
    expect(top()).toBeUndefined();
  });

  it('acts the same on the second cycle', () => {
    systemKeyboardShown();
    for (let cycle = 0; cycle < 2; cycle++) {
      setKeyboard(customOpening);
      expect(top()).toBe(TOOLBAR_TOP);
      setKeyboard(customOpen);
      layOut(TOOLBAR_TOP, FULL_WINDOW);
      setKeyboard(systemUp);
      expect(top()).toBe(TOOLBAR_TOP);
      layOut(TOOLBAR_TOP, KEYBOARD_TOP);
      expect(top()).toBeUndefined();
    }
  });

  it('follows a custom keyboard taller than the system keyboard', () => {
    systemKeyboardShown();
    setKeyboard(customOpening);
    setKeyboard({ ...customOpen, keyboardTop: KEYBOARD_TOP - 30 });
    expect(top()).toBe(TOOLBAR_TOP - 30);
  });

  it('lets go after a while if the view never sits on the keyboard again', () => {
    systemKeyboardShown();
    setKeyboard(customOpening);
    setKeyboard(systemUp);
    expect(top()).toBe(TOOLBAR_TOP);
    act(() => {
      jest.advanceTimersByTime(ANCHOR_HOLD_MS);
    });
    expect(top()).toBeUndefined();
  });

  it('lets go once no keyboard is up', () => {
    systemKeyboardShown();
    setKeyboard(customOpening);
    setKeyboard(keyboardDown);
    expect(top()).toBeUndefined();
  });

  it('is not anchored before it sat on a keyboard', () => {
    setKeyboard(customOpening);
    expect(top()).toBeUndefined();
  });

  it('is not anchored where the window overlays the keyboard', () => {
    setKeyboard({ ...systemUp, windowOverlaysKeyboard: true });
    layOut(TOOLBAR_TOP, KEYBOARD_TOP);
    setKeyboard({ ...customOpening, windowOverlaysKeyboard: true });
    expect(top()).toBeUndefined();
  });

  it('is not anchored on iOS', () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    systemKeyboardShown();
    setKeyboard(customOpening);
    expect(top()).toBeUndefined();
  });
});

describe('anchoring helpers', () => {
  it('anchors only a view placed by its bottom alone', () => {
    expect(isBottomAnchoredStyle(bottomBar)).toBe(true);
    expect(
      isBottomAnchoredStyle([bottomBar, { justifyContent: 'flex-start' }])
    ).toBe(true);
    expect(isBottomAnchoredStyle(undefined)).toBe(false);
    expect(isBottomAnchoredStyle({ flex: 1 })).toBe(false);
    expect(isBottomAnchoredStyle({ ...bottomBar, top: 0 })).toBe(false);
    expect(isBottomAnchoredStyle({ ...bottomBar, height: 100 })).toBe(false);
    expect(
      isBottomAnchoredStyle({ ...bottomBar, justifyContent: 'flex-end' })
    ).toBe(false);
    expect(isBottomAnchoredStyle({ ...bottomBar, flexDirection: 'row' })).toBe(
      false
    );
    expect(isBottomAnchoredStyle({ position: 'absolute', top: 10 })).toBe(
      false
    );
  });

  it('tells a layout that already sits on the keyboard', () => {
    const input = {
      paddingBottom: 0,
      inlineKeyboardHeight: 0,
      keyboardTop: KEYBOARD_TOP,
    };
    expect(sitsOnKeyboard({ ...input, viewBottom: KEYBOARD_TOP })).toBe(true);
    // Measured before the window shrank for the system keyboard.
    expect(sitsOnKeyboard({ ...input, viewBottom: FULL_WINDOW })).toBe(false);
    expect(
      sitsOnKeyboard({
        ...input,
        viewBottom: FULL_WINDOW,
        inlineKeyboardHeight: KEYBOARD,
      })
    ).toBe(true);
    expect(
      sitsOnKeyboard({ ...input, viewBottom: 319, keyboardTop: null })
    ).toBe(false);
  });

  it('moves the anchor with the keyboard and drops it for another window size', () => {
    const anchor = {
      top: TOOLBAR_TOP,
      keyboardTop: KEYBOARD_TOP,
      windowWidth: 320,
      windowHeight: 640,
    };
    const window = { width: 320, height: 640 };
    expect(getAnchoredTop(anchor, KEYBOARD_TOP, window)).toBe(TOOLBAR_TOP);
    expect(getAnchoredTop(anchor, KEYBOARD_TOP - 30, window)).toBe(
      TOOLBAR_TOP - 30
    );
    expect(getAnchoredTop(anchor, null, window)).toBeUndefined();
    expect(getAnchoredTop(null, KEYBOARD_TOP, window)).toBeUndefined();
    expect(
      getAnchoredTop(anchor, KEYBOARD_TOP, { width: 640, height: 320 })
    ).toBeUndefined();
  });
});

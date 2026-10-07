import {
  MIN_KEYBOARD_HEIGHT,
  createKeyboardStore,
  type CustomKeyboardControls,
  type CustomKeyboardHostState,
  type WindowSize,
} from '../../../native/keyboardStore';
import { IOS_ANIMATION, createFakeKeyboard } from './fakes';

const controls: CustomKeyboardControls = {
  activeKeyboardID: undefined,
  open: jest.fn(),
  close: jest.fn(),
  dismiss: jest.fn(),
};

const closedHost: CustomKeyboardHostState = {
  activeKeyboardID: undefined,
  open: false,
  height: 0,
  overlaysWindow: false,
};

const setup = (
  platform = 'ios',
  getNavigationBarInset?: () => Promise<number>
) => {
  const keyboard = createFakeKeyboard();
  let window: WindowSize = { width: 390, height: 844 };
  const store = createKeyboardStore({
    keyboard,
    getWindowSize: () => window,
    platform,
    getNavigationBarInset,
  });
  const listener = jest.fn();
  const unsubscribe = store.subscribe(listener);
  return {
    keyboard,
    store,
    listener,
    unsubscribe,
    rotate: () => {
      window = { width: window.height, height: window.width };
    },
  };
};

describe('keyboardStore', () => {
  it('starts closed', () => {
    const { store } = setup();
    expect(store.getSnapshot()).toEqual({
      windowOverlaysKeyboard: true,
      isKeyboardUp: false,
      keyboardHeight: 0,
      isCustomKeyboardOpen: false,
      activeCustomKeyboardID: undefined,
      systemKeyboardHeight: 0,
      lastKeyboardHeight: 0,
      keyboardCoverHeight: 0,
      inlineKeyboardHeight: 0,
    });
  });

  it('tracks the system keyboard like the 1.0 hook', () => {
    const { store, keyboard, listener } = setup();
    keyboard.emit('keyboardWillShow', 336, IOS_ANIMATION);
    expect(store.getSnapshot()).toMatchObject({
      isKeyboardUp: true,
      keyboardHeight: 336,
      systemKeyboardHeight: 336,
    });
    keyboard.emit('keyboardWillHide', 336, IOS_ANIMATION);
    expect(store.getSnapshot()).toMatchObject({
      isKeyboardUp: false,
      keyboardHeight: 0,
      lastKeyboardHeight: 336,
    });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('keeps the snapshot identity when nothing changed', () => {
    const { store, keyboard, listener } = setup();
    keyboard.emit('keyboardWillShow', 336);
    const snapshot = store.getSnapshot();
    keyboard.emit('keyboardDidShow', 336);
    expect(store.getSnapshot()).toBe(snapshot);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('caches the keyboard height per orientation', () => {
    const { store, keyboard, rotate } = setup();
    expect(store.getKeyboardHeight()).toBe(Math.round(0.38 * 844));
    expect(store.getKeyboardHeight(250)).toBe(250);
    keyboard.emit('keyboardDidShow', 336);
    expect(store.getKeyboardHeight(250)).toBe(336);
    rotate();
    expect(store.getKeyboardHeight(250)).toBe(250);
    keyboard.emit('keyboardDidShow', 209);
    expect(store.getKeyboardHeight()).toBe(209);
    rotate();
    expect(store.getKeyboardHeight()).toBe(336);
  });

  it('does not cache heights below a real keyboard', () => {
    const { store, keyboard } = setup();
    keyboard.emit('keyboardWillShow', MIN_KEYBOARD_HEIGHT - 1);
    expect(store.getSnapshot()).toMatchObject({
      isKeyboardUp: true,
      lastKeyboardHeight: 0,
    });
    expect(store.getKeyboardHeight(250)).toBe(250);
  });

  it('reports the open custom keyboard instead of the system one', () => {
    const { store, keyboard } = setup();
    const editor = {};
    const host = store.registerHost(editor, controls, closedHost);
    keyboard.emit('keyboardDidShow', 336);
    host.update({ open: true, activeKeyboardID: 'kb', height: 300 });
    expect(store.getSnapshot()).toMatchObject({
      isKeyboardUp: true,
      keyboardHeight: 300,
      isCustomKeyboardOpen: true,
      activeCustomKeyboardID: 'kb',
      systemKeyboardHeight: 336,
    });
    expect(store.getHost(editor)?.state.height).toBe(300);
    host.unregister();
    expect(store.getSnapshot().isCustomKeyboardOpen).toBe(false);
    expect(store.getHost()).toBeUndefined();
  });

  it('finds the host of an editor or the latest one', () => {
    const { store, listener } = setup();
    const first = {};
    const second = {};
    store.registerHost(first, controls, closedHost);
    store.registerHost(second, controls, closedHost);
    expect(store.getHost(first)?.editor).toBe(first);
    expect(store.getHost()?.editor).toBe(second);
    expect(store.getHost({})).toBeUndefined();
    // Host changes notify even when the keyboard snapshot is unchanged.
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('knows when the keyboard overlays the window', () => {
    expect(setup('ios').store.getSnapshot().windowOverlaysKeyboard).toBe(true);
    const { store } = setup('android');
    expect(store.getSnapshot().windowOverlaysKeyboard).toBe(false);
    const host = store.registerHost({}, controls, closedHost);
    host.update({ overlaysWindow: true });
    expect(store.getSnapshot().windowOverlaysKeyboard).toBe(true);
    host.update({ overlaysWindow: false });
    store.setEdgeToEdge(true);
    expect(store.getSnapshot().windowOverlaysKeyboard).toBe(true);
  });

  it('covers the window by the keyboard height on iOS', () => {
    const { store, keyboard } = setup('ios');
    keyboard.emit('keyboardWillShow', 336);
    expect(store.getSnapshot().keyboardCoverHeight).toBe(336);
    keyboard.emit('keyboardWillHide', 0);
    expect(store.getSnapshot().keyboardCoverHeight).toBe(0);
  });

  it('adds the edge-to-edge navigation bar the Android keyboard covers', async () => {
    const getInset = jest.fn(() => Promise.resolve(24));
    const { store, keyboard } = setup('android', getInset);
    keyboard.emit('keyboardDidShow', 279);
    await Promise.resolve();
    expect(getInset).toHaveBeenCalled();
    expect(store.getSnapshot()).toMatchObject({
      windowOverlaysKeyboard: true,
      keyboardHeight: 279,
      keyboardCoverHeight: 303,
    });
    keyboard.emit('keyboardDidHide', 0);
    expect(store.getSnapshot().keyboardCoverHeight).toBe(0);
  });

  it('leaves the system keyboard to a window that resizes for it', async () => {
    const { store, keyboard } = setup('android', () => Promise.resolve(0));
    keyboard.emit('keyboardDidShow', 279);
    await Promise.resolve();
    expect(store.getSnapshot()).toMatchObject({
      windowOverlaysKeyboard: false,
      keyboardCoverHeight: 0,
    });
    // An overlay custom keyboard still covers it.
    const host = store.registerHost({}, controls, closedHost);
    keyboard.emit('keyboardDidHide', 0);
    host.update({ open: true, height: 279 });
    expect(store.getSnapshot().keyboardCoverHeight).toBe(279);
  });

  it('counts the navigation bar under a custom keyboard', () => {
    const { store } = setup('android');
    store.setNavigationBarInset(24);
    const host = store.registerHost({}, controls, closedHost);
    host.update({ open: true, height: 279 });
    expect(store.getSnapshot().keyboardCoverHeight).toBe(303);
  });

  it('listens to the keyboard only while subscribed', () => {
    const { keyboard, store, unsubscribe } = setup();
    expect(keyboard.listenerCount()).toBe(5);
    const stop = store.subscribeEvents(() => {});
    unsubscribe();
    expect(keyboard.listenerCount()).toBe(5);
    stop();
    expect(keyboard.listenerCount()).toBe(0);
  });

  it('seeds the state from a keyboard that is already up', () => {
    const keyboard = Object.assign(createFakeKeyboard(), {
      isVisible: () => true,
      metrics: () => ({ height: 320 }),
    });
    const store = createKeyboardStore({
      keyboard,
      getWindowSize: () => ({ width: 390, height: 844 }),
      platform: 'android',
    });
    store.subscribe(() => {});
    expect(store.getSnapshot()).toMatchObject({
      isKeyboardUp: true,
      keyboardHeight: 320,
    });
  });

  it('drops a keyboard that hid while nobody listened', () => {
    let visible = true;
    const keyboard = Object.assign(createFakeKeyboard(), {
      isVisible: () => visible,
      metrics: () => (visible ? { height: 320 } : undefined),
    });
    const store = createKeyboardStore({
      keyboard,
      getWindowSize: () => ({ width: 390, height: 844 }),
      platform: 'ios',
    });
    const unsubscribe = store.subscribe(() => {});
    expect(store.getSnapshot().isKeyboardUp).toBe(true);
    unsubscribe();

    visible = false;
    const listener = jest.fn();
    store.subscribe(listener);

    expect(store.getSnapshot()).toMatchObject({
      isKeyboardUp: false,
      keyboardHeight: 0,
      lastKeyboardHeight: 320,
    });
    expect(listener).toHaveBeenCalled();
  });

  it('delivers events after the snapshot was updated', () => {
    const { store, keyboard } = setup();
    const seen: boolean[] = [];
    store.subscribeEvents(() =>
      seen.push(store.getSnapshot().systemKeyboardHeight > 0)
    );
    keyboard.emit('keyboardWillShow', 336);
    expect(seen).toEqual([true]);
  });
});

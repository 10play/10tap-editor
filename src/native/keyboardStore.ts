import {
  Dimensions,
  Keyboard,
  Platform,
  StatusBar,
  type KeyboardEvent,
  type KeyboardEventName,
} from 'react-native';
import { getNativeKeyboardModule } from '../RichText/Keyboard/nativeModule';
import type { Listener, Unsubscribe } from '../shared/contracts';
import { shallowEqual } from './stores';

/**
 * Process-wide keyboard state: the system keyboard as reported by RN's
 * `Keyboard` events, a per-orientation height cache, and the mounted
 * `CustomKeyboard` hosts. `useKeyboard()` reads it with
 * `useSyncExternalStore`, so every consumer sees one consistent value that
 * holds the keyboard height through custom/system swaps.
 */

/**
 * End heights below this are not a usable keyboard: the empty input view the
 * iOS driver installs, or the iPad shortcut bar of a hardware keyboard.
 */
export const MIN_KEYBOARD_HEIGHT = 80;

/** Keyboard height before any system keyboard was seen: this share of the window. */
export const DEFAULT_KEYBOARD_HEIGHT_RATIO = 0.38;

const KEYBOARD_EVENTS: readonly KeyboardEventName[] = [
  'keyboardWillShow',
  'keyboardDidShow',
  'keyboardWillHide',
  'keyboardDidHide',
  'keyboardWillChangeFrame',
];

export interface SystemKeyboardEvent {
  name: KeyboardEventName;
  /** End height in dp; 0 for hide events without coordinates. */
  height: number;
  duration: number;
  easing: KeyboardEvent['easing'] | undefined;
}

/** The subset of RN's `Keyboard` module the store uses. */
export interface KeyboardEventSource {
  addListener(
    name: KeyboardEventName,
    listener: (event: KeyboardEvent) => void
  ): { remove(): void };
  isVisible?(): boolean;
  metrics?(): { height: number; screenY?: number } | undefined;
}

export interface WindowSize {
  width: number;
  height: number;
}

/** Imperative API of one mounted `CustomKeyboard`. */
export interface CustomKeyboardControls {
  activeKeyboardID: string | undefined;
  open(id: string): void;
  /** Closes the custom keyboard; `toSystem` (default) brings the system keyboard back. */
  close(toSystem?: boolean): void;
  /** Closes the custom keyboard without showing the system keyboard. */
  dismiss(): void;
}

export interface CustomKeyboardHostState {
  activeKeyboardID: string | undefined;
  /** The custom keyboard occupies the keyboard area (opening, open, or closing before the system keyboard took over). */
  open: boolean;
  /** Custom keyboard height in dp. */
  height: number;
  /** Android `'stable'` mode applied, or the window is edge-to-edge. */
  overlaysWindow: boolean;
  /** Height in dp of the in-flow slot of an inline keyboard, 0 for an overlay. */
  slotHeight?: number;
}

export interface CustomKeyboardHost {
  readonly editor: object;
  readonly controls: CustomKeyboardControls;
  readonly state: CustomKeyboardHostState;
}

export interface CustomKeyboardHostHandle {
  update(state: Partial<CustomKeyboardHostState>): void;
  unregister(): void;
}

/** What `useKeyboard()` returns. Heights are in dp. */
export interface KeyboardState {
  /** System keyboard visible or a custom keyboard open. */
  isKeyboardUp: boolean;
  /**
   * Height of whichever keyboard is up, 0 when none is. Held through
   * custom/system swaps.
   */
  keyboardHeight: number;
  isCustomKeyboardOpen: boolean;
  activeCustomKeyboardID: string | undefined;
  /** Height of the system keyboard, 0 while it is hidden. */
  systemKeyboardHeight: number;
  /** Last usable system keyboard height, kept after it hides; 0 before the first one. */
  lastKeyboardHeight: number;
  /**
   * True when the keyboard covers the window instead of resizing it (iOS,
   * Android `'stable'` mode, edge-to-edge). `RichText` then applies document
   * padding and the scroll threshold.
   */
  windowOverlaysKeyboard: boolean;
  /**
   * How far up from the bottom of the window the keyboard reaches: its
   * height plus, on edge-to-edge Android, the navigation bar it covers
   * without counting it. 0 while no keyboard covers the window, including a
   * system keyboard the window resizes for.
   */
  keyboardCoverHeight: number;
  /**
   * Height of the in-flow slot of an inline `CustomKeyboard`, which takes
   * its own space at the bottom of the layout; 0 for an overlay keyboard or
   * none. `EditorKeyboardAvoidingView` pads only the rest of the cover.
   */
  inlineKeyboardHeight: number;
  /**
   * Top of whichever keyboard is up in window coordinates, the space
   * `measureInWindow` reports in; null while none is up or before its
   * position is known. A view covers the keyboard by
   * `max(0, viewBottom - keyboardTop)`, wherever it ends and whatever
   * navigation bar the keyboard reaches over. A custom keyboard takes the
   * place of the system keyboard: its bottom is where the system keyboard
   * last ended in this orientation.
   */
  keyboardTop: number | null;
}

export interface KeyboardStore {
  getSnapshot(): KeyboardState;
  subscribe(listener: () => void): Unsubscribe;
  /** Raw system keyboard events, delivered after the snapshot was updated. */
  subscribeEvents(listener: Listener<SystemKeyboardEvent>): Unsubscribe;
  /**
   * Height for a custom keyboard: the last system keyboard height in the
   * current orientation, else `defaultHeight`, else a share of the window.
   */
  getKeyboardHeight(defaultHeight?: number): number;
  /**
   * Where the system keyboard last ended in the current orientation, in
   * window coordinates: above the navigation bar on edge-to-edge Android.
   * A custom keyboard ends there too. Undefined before one was seen.
   */
  getKeyboardBottom(): number | undefined;
  registerHost(
    editor: object,
    controls: CustomKeyboardControls,
    state: CustomKeyboardHostState
  ): CustomKeyboardHostHandle;
  /** The host of `editor`, or the most recently mounted one. */
  getHost(editor?: object): CustomKeyboardHost | undefined;
  /** Set when the native module reports a navigation bar inset (Android edge-to-edge). */
  setEdgeToEdge(edgeToEdge: boolean): void;
  /**
   * Height in dp of the navigation bar the app draws behind (Android
   * edge-to-edge), 0 otherwise. A positive inset also means edge-to-edge.
   */
  setNavigationBarInset(inset: number): void;
  /**
   * Places window coordinates on the screen from a measured view, so
   * keyboard events convert to them. `measureViewGeometry` reports here.
   */
  reportViewGeometry(geometry: ViewGeometry): void;
}

export interface KeyboardStoreOptions {
  keyboard: KeyboardEventSource;
  getWindowSize(): WindowSize;
  platform: string;
  /**
   * Android: the navigation bar inset in dp, read again whenever the system
   * keyboard shows. Without it (native module not linked) the inset is only
   * known once a `CustomKeyboard` reports it.
   */
  getNavigationBarInset?(): Promise<number>;
  /** Android: the status bar height in dp (`StatusBar.currentHeight`). */
  getStatusBarHeight?(): number;
  /**
   * Android: the status bar height in dp from the native module, read again
   * whenever the system keyboard shows. It replaces `getStatusBarHeight`,
   * which React Native reads once and leaves at 0 when that happens before
   * the window is attached.
   */
  readStatusBarHeight?(): Promise<number>;
  /** Screen height in dp, `Dimensions.get('screen').height`. */
  getScreenHeight?(): number;
}

/** A view measured both in the window and relative to its root view. */
export interface ViewGeometry {
  /** `measureInWindow` y. */
  windowY: number;
  /** `measure` pageY: relative to the React root view. */
  pageY: number;
  height: number;
}

type Orientation = 'portrait' | 'landscape';

interface MutableHost extends CustomKeyboardHost {
  state: CustomKeyboardHostState;
}

export function createKeyboardStore({
  keyboard,
  getWindowSize,
  platform,
  getNavigationBarInset,
  getStatusBarHeight = () => 0,
  readStatusBarHeight,
  getScreenHeight = () => getWindowSize().height,
}: KeyboardStoreOptions): KeyboardStore {
  const stateListeners = new Set<() => void>();
  const eventListeners = new Set<Listener<SystemKeyboardEvent>>();
  const heightCache: Partial<Record<Orientation, number>> = {};
  // Where the system keyboard ends, in screen coordinates.
  const bottomCache: Partial<Record<Orientation, number>> = {};
  let hosts: MutableHost[] = [];
  let systemVisible = false;
  let systemHeight = 0;
  let lastHeight = 0;
  // The system keyboard's top in screen coordinates.
  let systemScreenTop: number | null = null;
  let statusBarHeight = getStatusBarHeight();
  // Window y minus root view y of a measured view; see `reportViewGeometry`.
  let rootOffset = 0;
  let fullScreenRoot = false;
  let edgeToEdge = false;
  let navigationBarInset = 0;
  let subscriptions: { remove(): void }[] = [];
  // Listeners run with the snapshot already updated; host updates they make
  // are folded into one change notification.
  let dispatching = false;
  let hostsChangedDuringDispatch = false;

  const orientation = (): Orientation => {
    const { width, height } = getWindowSize();
    return width > height ? 'landscape' : 'portrait';
  };

  /** Screen y of the origin of window coordinates. */
  const getWindowOffset = () =>
    (fullScreenRoot ? 0 : statusBarHeight) - rootOffset;

  const getKeyboardBottom = () => {
    const bottom = bottomCache[orientation()];
    return bottom === undefined ? undefined : bottom - getWindowOffset();
  };

  const computeSnapshot = (): KeyboardState => {
    let openHost: MutableHost | undefined;
    for (let i = hosts.length - 1; i >= 0 && !openHost; i--) {
      if (hosts[i]!.state.open) openHost = hosts[i];
    }
    const customOpen = openHost !== undefined;
    const windowOverlaysKeyboard =
      platform === 'ios' ||
      edgeToEdge ||
      navigationBarInset > 0 ||
      hosts.some((host) => host.state.overlaysWindow);
    const keyboardHeight = openHost ? openHost.state.height : systemHeight;
    const keyboardBottom = getKeyboardBottom();
    let keyboardTop: number | null = null;
    if (openHost) {
      if (keyboardBottom !== undefined && keyboardHeight > 0) {
        keyboardTop = keyboardBottom - keyboardHeight;
      }
    } else if (systemVisible && systemScreenTop !== null) {
      keyboardTop = systemScreenTop - getWindowOffset();
    }
    return {
      isKeyboardUp: systemVisible || customOpen,
      keyboardHeight,
      isCustomKeyboardOpen: customOpen,
      activeCustomKeyboardID: openHost?.state.activeKeyboardID,
      systemKeyboardHeight: systemHeight,
      lastKeyboardHeight: lastHeight,
      windowOverlaysKeyboard,
      inlineKeyboardHeight: hosts.reduce(
        (sum, host) => sum + (host.state.slotHeight ?? 0),
        0
      ),
      keyboardCoverHeight: getKeyboardCoverHeight({
        keyboardHeight,
        customOpen,
        systemHeight,
        windowOverlaysKeyboard,
        navigationBarInset,
      }),
      keyboardTop,
    };
  };

  let snapshot = computeSnapshot();
  let published = snapshot;

  const refresh = () => {
    const next = computeSnapshot();
    if (!shallowEqual(next, snapshot)) snapshot = next;
  };

  /** `hostsChanged` notifies even when the snapshot is equal, for `getHost` readers. */
  const emitChange = (hostsChanged = false) => {
    refresh();
    if (dispatching) {
      hostsChangedDuringDispatch ||= hostsChanged;
      return;
    }
    if (snapshot === published && !hostsChanged) return;
    published = snapshot;
    stateListeners.forEach((listener) => listener());
  };

  /** Records the system keyboard; `screenY` is its top on the screen, if known. */
  const recordKeyboard = (height: number, screenY: number | undefined) => {
    systemVisible = height > 0;
    systemHeight = height;
    systemScreenTop =
      systemVisible && screenY !== undefined && screenY > 0 ? screenY : null;
    if (height < MIN_KEYBOARD_HEIGHT) return;
    heightCache[orientation()] = height;
    lastHeight = height;
    if (systemScreenTop !== null) {
      bottomCache[orientation()] = systemScreenTop + height;
    }
  };

  const setNavigationBarInset = (inset: number) => {
    if (inset === navigationBarInset) return;
    navigationBarInset = inset;
    emitChange();
  };

  /** Applies a change to how window coordinates lie on the screen. */
  const moveWindowOrigin = (change: () => void) => {
    const before = getWindowOffset();
    change();
    if (Math.abs(getWindowOffset() - before) >= 0.5) emitChange();
  };

  const refreshInsets = () => {
    if (platform !== 'android') return;
    getNavigationBarInset?.().then(setNavigationBarInset, () => {});
    readStatusBarHeight?.().then(
      (height) =>
        moveWindowOrigin(() => {
          statusBarHeight = height;
        }),
      () => {}
    );
  };

  const onKeyboardEvent = (name: KeyboardEventName, event: KeyboardEvent) => {
    // Android reports a negative height for an IME that opens while its
    // insets are still empty (the system bars are subtracted from 0).
    const height = Math.max(0, event?.endCoordinates?.height ?? 0);
    switch (name) {
      case 'keyboardWillShow':
      case 'keyboardDidShow':
        recordKeyboard(height, event?.endCoordinates?.screenY);
        if (systemVisible) refreshInsets();
        break;
      case 'keyboardWillHide':
      case 'keyboardDidHide':
        recordKeyboard(0, undefined);
        break;
      default:
        break;
    }
    const systemEvent: SystemKeyboardEvent = {
      name,
      height,
      duration: event?.duration ?? 0,
      easing: event?.easing,
    };
    refresh();
    dispatching = true;
    try {
      eventListeners.forEach((listener) => listener(systemEvent));
    } finally {
      dispatching = false;
    }
    const hostsChanged = hostsChangedDuringDispatch;
    hostsChangedDuringDispatch = false;
    emitChange(hostsChanged);
  };

  const attachIfNeeded = () => {
    if (subscriptions.length > 0) return;
    subscriptions = KEYBOARD_EVENTS.map((name) =>
      keyboard.addListener(name, (event) => onKeyboardEvent(name, event))
    );
    // Events were missed while nobody listened: start from the keyboard's
    // current state, not the last one seen.
    const metrics = keyboard.isVisible?.() ? keyboard.metrics?.() : undefined;
    recordKeyboard(metrics?.height ?? 0, metrics?.screenY);
    refreshInsets();
    emitChange();
  };

  const detachIfUnused = () => {
    if (stateListeners.size > 0 || eventListeners.size > 0) return;
    subscriptions.forEach((subscription) => subscription.remove());
    subscriptions = [];
  };

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      stateListeners.add(listener);
      attachIfNeeded();
      return () => {
        stateListeners.delete(listener);
        detachIfUnused();
      };
    },
    subscribeEvents(listener) {
      eventListeners.add(listener);
      attachIfNeeded();
      return () => {
        eventListeners.delete(listener);
        detachIfUnused();
      };
    },
    getKeyboardHeight(defaultHeight) {
      const cached = heightCache[orientation()];
      if (cached !== undefined) return cached;
      if (defaultHeight !== undefined) return defaultHeight;
      return Math.round(DEFAULT_KEYBOARD_HEIGHT_RATIO * getWindowSize().height);
    },
    getKeyboardBottom,
    registerHost(editor, controls, state) {
      const host: MutableHost = { editor, controls, state: { ...state } };
      hosts = [...hosts, host];
      emitChange(true);
      return {
        update(partial) {
          host.state = { ...host.state, ...partial };
          emitChange(true);
        },
        unregister() {
          if (!hosts.includes(host)) return;
          hosts = hosts.filter((candidate) => candidate !== host);
          emitChange(true);
        },
      };
    },
    getHost(editor) {
      for (let i = hosts.length - 1; i >= 0; i--) {
        const host = hosts[i]!;
        if (editor === undefined || host.editor === editor) return host;
      }
      return undefined;
    },
    setEdgeToEdge(value) {
      if (edgeToEdge === value) return;
      edgeToEdge = value;
      emitChange();
    },
    setNavigationBarInset,
    reportViewGeometry({ windowY, pageY, height }) {
      if (![windowY, pageY, height].every(Number.isFinite)) return;
      // Window coordinates start at the root view, or (older React Native
      // on Android) at the top of the visible display frame, below the
      // status bar. The root view starts at the top of the screen when the
      // app draws behind the status bar: then either the window y is above
      // the root y, or the view reaches further down than a root below the
      // status bar could.
      moveWindowOrigin(() => {
        rootOffset = windowY - pageY;
        fullScreenRoot ||=
          rootOffset < -1 ||
          pageY + height > getScreenHeight() - statusBarHeight + 1;
      });
    },
  };
}

export interface KeyboardCoverInput {
  keyboardHeight: number;
  customOpen: boolean;
  systemHeight: number;
  windowOverlaysKeyboard: boolean;
  navigationBarInset: number;
}

/**
 * Height of the bottom of the window under the keyboard. React Native
 * reports the system keyboard without the navigation bar below it, which an
 * edge-to-edge window still extends behind. Where the window resizes for the
 * system keyboard, only a custom keyboard covers it.
 */
export const getKeyboardCoverHeight = ({
  keyboardHeight,
  customOpen,
  systemHeight,
  windowOverlaysKeyboard,
  navigationBarInset,
}: KeyboardCoverInput): number => {
  const covers = windowOverlaysKeyboard
    ? customOpen || systemHeight > 0
    : customOpen && systemHeight === 0;
  return covers && keyboardHeight > 0 ? keyboardHeight + navigationBarInset : 0;
};

const nativeKeyboardModule = getNativeKeyboardModule();

export const keyboardStore: KeyboardStore = createKeyboardStore({
  keyboard: Keyboard,
  getWindowSize: () => Dimensions.get('window'),
  platform: Platform.OS,
  getNavigationBarInset: nativeKeyboardModule
    ? () => nativeKeyboardModule.getNavigationBarInset()
    : undefined,
  getStatusBarHeight: () =>
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
  readStatusBarHeight: nativeKeyboardModule
    ? () => nativeKeyboardModule.getStatusBarHeight()
    : undefined,
  getScreenHeight: () => Dimensions.get('screen').height,
});

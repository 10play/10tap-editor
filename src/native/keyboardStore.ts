import {
  Dimensions,
  Keyboard,
  Platform,
  type KeyboardEvent,
  type KeyboardEventName,
} from 'react-native';
import type {
  KeyboardSnapshot,
  Listener,
  Unsubscribe,
} from '../shared/contracts';

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
  metrics?(): { height: number } | undefined;
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

/** What `useKeyboard()` returns: the 1.0 fields plus the `KeyboardSnapshot` contract. */
export interface KeyboardState extends KeyboardSnapshot {
  /** System keyboard visible or a custom keyboard open. */
  isKeyboardUp: boolean;
  /** Height of whichever keyboard is up (`effectiveHeight`), 0 when none is. */
  keyboardHeight: number;
  /** Same as `customOpen`. */
  isCustomKeyboardOpen: boolean;
  activeCustomKeyboardID: string | undefined;
  /** Same as `systemHeight`. */
  systemKeyboardHeight: number;
  /** Last usable system keyboard height, kept after it hides; 0 before the first one. */
  lastKeyboardHeight: number;
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
  getWindowHeight(): number;
  registerHost(
    editor: object,
    controls: CustomKeyboardControls,
    state: CustomKeyboardHostState
  ): CustomKeyboardHostHandle;
  /** The host of `editor`, or the most recently mounted one. */
  getHost(editor?: object): CustomKeyboardHost | undefined;
  /** Set when the native module reports a navigation bar inset (Android edge-to-edge). */
  setEdgeToEdge(edgeToEdge: boolean): void;
}

export interface KeyboardStoreOptions {
  keyboard: KeyboardEventSource;
  getWindowSize(): WindowSize;
  platform: string;
}

type Orientation = 'portrait' | 'landscape';

interface MutableHost extends CustomKeyboardHost {
  state: CustomKeyboardHostState;
}

export function createKeyboardStore({
  keyboard,
  getWindowSize,
  platform,
}: KeyboardStoreOptions): KeyboardStore {
  const stateListeners = new Set<() => void>();
  const eventListeners = new Set<Listener<SystemKeyboardEvent>>();
  const heightCache: Partial<Record<Orientation, number>> = {};
  let hosts: MutableHost[] = [];
  let systemVisible = false;
  let systemHeight = 0;
  let lastHeight = 0;
  let edgeToEdge = false;
  let subscriptions: { remove(): void }[] = [];
  // Listeners run with the snapshot already updated; host updates they make
  // are folded into one change notification.
  let dispatching = false;
  let hostsChangedDuringDispatch = false;

  const orientation = (): Orientation => {
    const { width, height } = getWindowSize();
    return width > height ? 'landscape' : 'portrait';
  };

  const computeSnapshot = (): KeyboardState => {
    let openHost: MutableHost | undefined;
    for (let i = hosts.length - 1; i >= 0 && !openHost; i--) {
      if (hosts[i]!.state.open) openHost = hosts[i];
    }
    const customOpen = openHost !== undefined;
    const effectiveHeight = openHost ? openHost.state.height : systemHeight;
    const windowOverlaysKeyboard =
      platform === 'ios' ||
      edgeToEdge ||
      hosts.some((host) => host.state.overlaysWindow);
    return {
      systemVisible,
      systemHeight,
      customOpen,
      effectiveHeight,
      windowOverlaysKeyboard,
      isKeyboardUp: systemVisible || customOpen,
      keyboardHeight: effectiveHeight,
      isCustomKeyboardOpen: customOpen,
      activeCustomKeyboardID: openHost?.state.activeKeyboardID,
      systemKeyboardHeight: systemHeight,
      lastKeyboardHeight: lastHeight,
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

  const recordHeight = (height: number) => {
    if (height < MIN_KEYBOARD_HEIGHT) return;
    heightCache[orientation()] = height;
    lastHeight = height;
  };

  const onKeyboardEvent = (name: KeyboardEventName, event: KeyboardEvent) => {
    const height = event?.endCoordinates?.height ?? 0;
    switch (name) {
      case 'keyboardWillShow':
      case 'keyboardDidShow':
        systemVisible = height > 0;
        systemHeight = height;
        recordHeight(height);
        break;
      case 'keyboardWillHide':
      case 'keyboardDidHide':
        systemVisible = false;
        systemHeight = 0;
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
    if (keyboard.isVisible?.()) {
      const height = keyboard.metrics?.()?.height ?? 0;
      systemVisible = height > 0;
      systemHeight = height;
      recordHeight(height);
      emitChange();
    }
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
    getWindowHeight: () => getWindowSize().height,
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
  };
}

function shallowEqual(a: KeyboardState, b: KeyboardState): boolean {
  const keys = Object.keys(a) as (keyof KeyboardState)[];
  return keys.every((key) => a[key] === b[key]);
}

export const keyboardStore: KeyboardStore = createKeyboardStore({
  keyboard: Keyboard,
  getWindowSize: () => Dimensions.get('window'),
  platform: Platform.OS,
});

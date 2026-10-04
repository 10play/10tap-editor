import { LayoutAnimation, type KeyboardEventName } from 'react-native';
import type { KeyboardEventSource } from '../../../native/keyboardStore';
import {
  attachEditorController,
  type CommandListener,
  type CommandMeta,
  type EditorController,
  type Listener,
  type MessageListener,
} from '../../../shared/contracts';
import type { BridgeMessage, WebMessage } from '../../../shared/protocol';
import type { BridgeState, EditorBridge, EditorTheme } from '../../../types';
import type { BackHandlerLike, LayoutAnimationLike } from '../keyboardSession';
import type { NativeKeyboardModule } from '../drivers';

type KeyboardHandler = Parameters<KeyboardEventSource['addListener']>[1];

export interface FakeKeyboard extends KeyboardEventSource {
  emit(
    name: KeyboardEventName,
    height: number,
    animation?: { duration: number; easing: 'keyboard' | 'linear' }
  ): void;
  listenerCount(): number;
}

export const createFakeKeyboard = (): FakeKeyboard => {
  const handlers = new Map<KeyboardEventName, Set<KeyboardHandler>>();
  return {
    addListener(name, handler) {
      const set = handlers.get(name) ?? new Set();
      set.add(handler);
      handlers.set(name, set);
      return { remove: () => set.delete(handler) };
    },
    emit(name, height, animation) {
      handlers.get(name)?.forEach((handler) =>
        handler({
          duration: animation?.duration ?? 0,
          easing: animation?.easing ?? 'keyboard',
          endCoordinates: { height, width: 390, screenX: 0, screenY: 0 },
        })
      );
    },
    listenerCount: () =>
      [...handlers.values()].reduce((count, set) => count + set.size, 0),
  };
};

/** iOS keyboard animation as UIKit reports it. */
export const IOS_ANIMATION = { duration: 250, easing: 'keyboard' } as const;

/** The controller surface the keyboard uses, recording every call. */
export class FakeController {
  ready = true;
  readonly injected: string[] = [];
  readonly persistent = new Map<string, string>();
  readonly commands: { message: BridgeMessage; meta: CommandMeta }[] = [];
  private internal: symbol | undefined;
  private readonly commandListeners = new Set<CommandListener>();
  private readonly messageListeners = new Map<string, Set<MessageListener>>();
  private readonly readyListeners = new Set<Listener<boolean>>();

  send(message: BridgeMessage) {
    const meta: CommandMeta = { internal: this.internal };
    this.commands.push({ message, meta });
    this.commandListeners.forEach((listener) => listener(message, meta));
  }

  runInternal<T>(token: symbol, fn: () => T): T {
    const previous = this.internal;
    this.internal = token;
    try {
      return fn();
    } finally {
      this.internal = previous;
    }
  }

  injectJS(js: string) {
    this.injected.push(js);
  }

  registerPersistentScript(key: string, js: string | null) {
    if (js === null) {
      this.persistent.delete(key);
      return;
    }
    this.persistent.set(key, js);
    if (this.ready) this.injected.push(js);
  }

  subscribeMessage<P>(type: string, listener: MessageListener<P>) {
    const set = this.messageListeners.get(type) ?? new Set<MessageListener>();
    set.add(listener as MessageListener);
    this.messageListeners.set(type, set);
    return () => {
      set.delete(listener as MessageListener);
    };
  }

  onCommand(listener: CommandListener) {
    this.commandListeners.add(listener);
    return () => {
      this.commandListeners.delete(listener);
    };
  }

  isReady() {
    return this.ready;
  }

  subscribeReady(listener: Listener<boolean>) {
    this.readyListeners.add(listener);
    return () => {
      this.readyListeners.delete(listener);
    };
  }

  /** A WebView reload: not ready, then ready again with persistent scripts replayed. */
  reload() {
    this.setReady(false);
    this.setReady(true);
  }

  setReady(ready: boolean) {
    this.ready = ready;
    if (ready) this.persistent.forEach((js) => this.injected.push(js));
    this.readyListeners.forEach((listener) => listener(ready));
  }

  receive(type: string, payload?: unknown) {
    const message: WebMessage = { type, payload };
    this.messageListeners
      .get(type)
      ?.forEach((listener) => listener(payload, message));
  }

  commandTypes() {
    return this.commands.map(({ message }) => message.type);
  }
}

export interface FakeEditor {
  editor: EditorBridge;
  controller: FakeController;
  setFocused(focused: boolean): void;
  setState(state: Partial<BridgeState>): void;
}

export const createFakeEditor = ({
  focused = true,
  withController = true,
  theme,
}: {
  focused?: boolean;
  withController?: boolean;
  theme?: Partial<EditorTheme>;
} = {}): FakeEditor => {
  const controller = new FakeController();
  let state = { isFocused: focused } as BridgeState;
  const subscribers = new Set<(state: BridgeState) => void>();
  const setState = (partial: Partial<BridgeState>) => {
    state = { ...state, ...partial };
    subscribers.forEach((subscriber) => subscriber(state));
  };
  const editor = {
    theme: { webview: {}, webviewContainer: {}, ...theme },
    webviewRef: { current: null },
    getEditorState: () => state,
    _subscribeToEditorStateUpdate: (cb: (state: BridgeState) => void) => {
      subscribers.add(cb);
      return () => {
        subscribers.delete(cb);
      };
    },
    focus: jest.fn((pos?: unknown) =>
      controller.send({ type: 'focus', payload: pos })
    ),
    blur: jest.fn(() => controller.send({ type: 'blur' })),
    setColor: jest.fn(),
    unsetColor: jest.fn(),
    setHighlight: jest.fn(),
    unsetHighlight: jest.fn(),
  } as unknown as EditorBridge;
  if (withController) {
    attachEditorController(
      editor,
      controller as unknown as EditorController<object>
    );
  }
  return {
    editor,
    controller,
    setFocused: (isFocused) => setState({ isFocused }),
    setState,
  };
};

type NativeMethod = Exclude<keyof NativeKeyboardModule, 'getConstants'>;

export type FakeNativeModule = NativeKeyboardModule & {
  [K in NativeMethod]: jest.Mock<
    ReturnType<NativeKeyboardModule[K]>,
    Parameters<NativeKeyboardModule[K]>
  >;
};

export const createFakeNativeModule = ({
  suppressResult = true,
  overlayResult = true,
  restoreResult = true,
  navigationBarInset = 0,
  systemKeyboardVisible = true,
}: {
  suppressResult?: boolean;
  overlayResult?: boolean;
  /** What restoring resolves; false means no focused WebView was found. */
  restoreResult?: boolean;
  navigationBarInset?: number;
  /** What the platform reports when asked whether the system keyboard is up. */
  systemKeyboardVisible?: boolean;
} = {}): FakeNativeModule => ({
  setSystemKeyboardSuppressed: jest.fn((suppressed: boolean) =>
    Promise.resolve(suppressed ? suppressResult : restoreResult)
  ),
  showSystemKeyboard: jest.fn(() => Promise.resolve(true)),
  isSystemKeyboardVisible: jest.fn(() =>
    Promise.resolve(systemKeyboardVisible)
  ),
  setWindowOverlayMode: jest.fn((_enabled: boolean) =>
    Promise.resolve(overlayResult)
  ),
  getNavigationBarInset: jest.fn(() => Promise.resolve(navigationBarInset)),
});

export const createFakeLayoutAnimation = () => {
  const configureNext = jest.fn();
  const layoutAnimation: LayoutAnimationLike = {
    configureNext,
    Types: LayoutAnimation.Types,
  };
  return { layoutAnimation, configureNext };
};

export const createFakeBackHandler = () => {
  const handlers = new Set<() => boolean | null | undefined>();
  const backHandler: BackHandlerLike = {
    addEventListener(_name, handler) {
      handlers.add(handler);
      return { remove: () => handlers.delete(handler) };
    },
  };
  return {
    backHandler,
    press: () => [...handlers].some((handler) => handler() === true),
    count: () => handlers.size,
  };
};

/** Lets queued microtasks and resolved promises run. */
export const flush = async (rounds = 10) => {
  for (let i = 0; i < rounds; i++) await Promise.resolve();
};

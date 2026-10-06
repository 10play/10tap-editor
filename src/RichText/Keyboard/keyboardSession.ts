import type { LayoutAnimation, LayoutAnimationConfig } from 'react-native';
import {
  MIN_KEYBOARD_HEIGHT,
  type CustomKeyboardControls,
  type CustomKeyboardHostHandle,
  type CustomKeyboardHostState,
  type KeyboardStore,
  type SystemKeyboardEvent,
} from '../../native/keyboardStore';
import type { Unsubscribe } from '../../shared/contracts';
import {
  REFOCUS_DELAY_MS,
  createFallbackDriver,
  createInlineDriver,
  createNativeDriver,
  hasSystemKeyboard,
  type DriverContext,
  type KeyboardDriver,
  type KeyboardDriverKind,
  type NativeKeyboardModule,
} from './drivers';
import type { EditorChannel } from './editorChannel';
import {
  INPUT_MODE_RESTORE_SCRIPT,
  INPUT_MODE_SUPPRESS_SCRIPT,
  pressListenerScript,
} from './webSnippets';

/**
 * One `CustomKeyboard` host: the state machine that swaps the system keyboard
 * for a custom one and back.
 *
 * The in-flow slot changes height only inside the handler of the keyboard
 * event a `KeyboardAvoidingView` reacts to, in a microtask, so both land in
 * the same React batch and the toolbar above them does not move.
 */

export type KeyboardPhase = 'closed' | 'opening' | 'open' | 'closing';

export type AndroidKeyboardMode = 'system' | 'stable';

export interface KeyboardErrorEvent {
  /**
   * - `verify-timeout`: the system keyboard was still up after suppressing
   *   it (600 ms, or 2 s when only keyboard events can tell). The host
   *   switches to the fallback driver.
   * - `native-error`: the native module rejected.
   */
  reason: 'verify-timeout' | 'native-error';
  driver: KeyboardDriverKind;
  error?: unknown;
}

/** Read on every use, so callers can pass the latest props. */
export interface KeyboardSessionOptions {
  defaultHeight?: number;
  closeOnEditorPress: boolean;
  /** Applied once, when the session attaches. */
  androidKeyboardMode: AndroidKeyboardMode;
  /** Height override of one keyboard (`CustomKeyboardExtension` options). */
  heightOf(id: string): number | undefined;
  /** Mirrors the active id into the parent (`setActiveKeyboardID`). */
  onActiveKeyboardChange(id: string | undefined): void;
  onOpen?(id: string): void;
  onClose?(): void;
  onKeyboardError?(event: KeyboardErrorEvent): void;
  /** The system keyboard came back while the custom one was up. */
  onSystemKeyboardReturn?(): void;
}

export interface LayoutAnimationLike {
  configureNext(config: LayoutAnimationConfig): void;
  Types: (typeof LayoutAnimation)['Types'];
}

export interface BackHandlerLike {
  addEventListener(
    name: 'hardwareBackPress',
    handler: () => boolean | null | undefined
  ): { remove(): void };
}

export interface KeyboardSessionDeps {
  platform: string;
  /** Registry key of the host (`useCustomKeyboard(editor)`). */
  editor: object;
  channel: EditorChannel;
  store: KeyboardStore;
  nativeModule: NativeKeyboardModule | null;
  forceFallback: boolean;
  getHiddenInput: DriverContext['getHiddenInput'];
  layoutAnimation: LayoutAnimationLike;
  backHandler: BackHandlerLike | null;
  getOptions(): KeyboardSessionOptions;
}

export interface KeyboardSessionView {
  phase: KeyboardPhase;
  activeKeyboardID: string | undefined;
  /** Keyboard whose body is mounted; outlives `activeKeyboardID` while closing. */
  renderedKeyboardID: string | undefined;
  /** Height of the in-flow slot: the keyboard plus the navigation bar inset. */
  slotHeight: number;
  /** Height of the keyboard content, as the system keyboard reports its own. */
  keyboardHeight: number;
  /**
   * Navigation bar inset on edge-to-edge Android. The system keyboard covers
   * it too without counting it in its height, so the body adds it below the
   * content.
   */
  navigationBarInset: number;
  driver: KeyboardDriverKind;
}

export interface KeyboardSession extends CustomKeyboardControls {
  getView(): KeyboardSessionView;
  subscribe(listener: () => void): Unsubscribe;
  /** Reversible: StrictMode attaches, detaches and attaches again. */
  attach(): void;
  /** Tears down every side effect; idempotent. */
  detach(): void;
  /** Applies the controlled `activeKeyboardID` prop. */
  sync(id: string | undefined): void;
}

/** Ceiling for the expected system keyboard transition after suppressing. */
export const VERIFY_TIMEOUT_MS = 600;
/**
 * Ceiling when the driver cannot ask the platform and only a hide event
 * proves the suppression: an IME in a Modal window can take over a second
 * to hide on a loaded Android device.
 */
export const EVENT_VERIFY_TIMEOUT_MS = 2000;
/** No keyboard event this long (hardware keyboard): animate the slot ourselves. */
export const EVENT_TIMEOUT_MS = 500;
/** Ceiling for keeping the body mounted under the incoming system keyboard. */
export const SHOW_CONFIRM_TIMEOUT_MS = 600;
/** Wait for an editor focus change requested by the keyboard. */
export const FOCUS_TIMEOUT_MS = 300;
/** Slot animation when no keyboard event drives it. */
export const SLOT_ANIMATION_MS = 250;

export const PRESS_LISTENER_SCRIPT_KEY = 'tentap.keyboard.pressListener';

/**
 * Hosts that applied Android's `'stable'` window mode. The window has one
 * soft input mode, so only the last of them to detach restores it.
 */
let overlayHosts = 0;
/** `setWindowOverlayMode(true)` calls in flight, across hosts. */
let overlayRequests = 0;

const microtask = (fn: () => void) => {
  Promise.resolve().then(fn);
};

export function createKeyboardSession(
  deps: KeyboardSessionDeps
): KeyboardSession {
  const { platform, channel, store, layoutAnimation } = deps;
  const isIOS = platform === 'ios';
  const driverContext: DriverContext = {
    platform,
    channel,
    getHiddenInput: deps.getHiddenInput,
  };

  let fallbackDriver: KeyboardDriver | undefined;
  const getFallbackDriver = () =>
    (fallbackDriver ??= createFallbackDriver(driverContext));
  const nativeDriver =
    deps.nativeModule && hasSystemKeyboard(platform)
      ? createNativeDriver(deps.nativeModule, driverContext)
      : undefined;
  const inlineDriver = hasSystemKeyboard(platform)
    ? undefined
    : createInlineDriver();
  let useFallback = deps.forceFallback;

  const currentDriver = (): KeyboardDriver =>
    inlineDriver ??
    (nativeDriver && !useFallback ? nativeDriver : getFallbackDriver());

  let attached = false;
  let phase: KeyboardPhase = 'closed';
  let activeId: string | undefined;
  let renderedId: string | undefined;
  let slotHeight = 0;
  let keyboardHeight = 0;
  let navigationBarInset = 0;
  let overlayApplied = false;
  let overlayRequested = false;
  // The system keyboard took over the keyboard area while closing.
  let handedOver = false;
  let closingToSystem = false;
  let hideSeen = false;
  let suppressed = false;
  // `inputmode="none"` injected before focusing an unfocused editor.
  let latchApplied = false;
  let controlledId: string | undefined;
  // Bumped by every transition; async continuations of older ones bail out.
  let epoch = 0;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const warned = new Set<string>();
  const listeners = new Set<() => void>();
  let unsubscribes: Unsubscribe[] = [];
  let host: CustomKeyboardHostHandle | undefined;

  const options = () => deps.getOptions();

  const hostState = (): CustomKeyboardHostState => ({
    activeKeyboardID: activeId,
    open:
      phase === 'opening' ||
      phase === 'open' ||
      (phase === 'closing' && !handedOver),
    height: keyboardHeight,
    overlaysWindow: overlayApplied || navigationBarInset > 0,
  });

  const buildView = (): KeyboardSessionView => ({
    phase,
    activeKeyboardID: activeId,
    renderedKeyboardID: renderedId,
    slotHeight,
    keyboardHeight,
    navigationBarInset,
    driver: currentDriver().kind,
  });
  let view = buildView();

  const emit = () => {
    view = buildView();
    host?.update(hostState());
    listeners.forEach((listener) => listener());
  };

  const schedule = (ms: number, fn: () => void) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };

  const clearTimers = () => {
    timers.forEach((id) => clearTimeout(id));
    timers.clear();
  };

  const notifyParent = (id: string | undefined) => {
    if (id === controlledId) return;
    controlledId = id;
    options().onActiveKeyboardChange(id);
  };

  const reportError = (event: KeyboardErrorEvent) => {
    options().onKeyboardError?.(event);
    if (__DEV__ && !warned.has(event.reason)) {
      warned.add(event.reason);
      console.warn(
        `[tentap] CustomKeyboard: ${event.reason} with the ${event.driver} driver; using the fallback driver.`,
        event.error ?? ''
      );
    }
  };

  /** KAV parity: animate only when the event carries duration and easing. */
  const configureAnimation = (event: SystemKeyboardEvent | null) => {
    if (event) {
      if (!event.duration || !event.easing) return;
      const duration = event.duration > 10 ? event.duration : 10;
      layoutAnimation.configureNext({
        duration,
        update: {
          duration,
          type: layoutAnimation.Types[event.easing] || 'keyboard',
        },
      });
      return;
    }
    layoutAnimation.configureNext({
      duration: SLOT_ANIMATION_MS,
      update: {
        duration: SLOT_ANIMATION_MS,
        type: isIOS ? 'keyboard' : 'easeInEaseOut',
      },
    });
  };

  const areaHeight = () => keyboardHeight + navigationBarInset;

  const commitSlot = (height: number, event: SystemKeyboardEvent | null) => {
    const token = epoch;
    microtask(() => {
      if (token !== epoch || slotHeight === height) return;
      configureAnimation(event);
      slotHeight = height;
      emit();
    });
  };

  const isHideEvent = (event: SystemKeyboardEvent) =>
    isIOS
      ? event.name === 'keyboardWillHide' ||
        ((event.name === 'keyboardWillShow' ||
          event.name === 'keyboardWillChangeFrame') &&
          event.height < MIN_KEYBOARD_HEIGHT)
      : event.name === 'keyboardDidHide';

  const isShowEvent = (event: SystemKeyboardEvent) =>
    event.name === (isIOS ? 'keyboardWillShow' : 'keyboardDidShow') &&
    event.height >= MIN_KEYBOARD_HEIGHT;

  const systemKeyboardUp = () => {
    return store.getSnapshot().systemKeyboardHeight >= MIN_KEYBOARD_HEIGHT;
  };

  const waitForFocus = (focused: boolean) =>
    new Promise<void>((resolve) => {
      if (channel.isFocused() === focused) {
        resolve();
        return;
      }
      let unsubscribe: Unsubscribe = () => {};
      const timer = setTimeout(done, FOCUS_TIMEOUT_MS);
      function done() {
        clearTimeout(timer);
        unsubscribe();
        resolve();
      }
      unsubscribe = channel.onFocusChange((next) => {
        if (next === focused) done();
      });
    });

  const unlatch = () => {
    if (!latchApplied) return;
    latchApplied = false;
    channel.injectScript(INPUT_MODE_RESTORE_SCRIPT);
  };

  const suppressWith = async (driver: KeyboardDriver, token: number) => {
    try {
      if (await driver.suppress()) return;
    } catch (error) {
      reportError({ reason: 'native-error', driver: driver.kind, error });
    }
    // A close or detach while the native call was in flight already ended
    // this transition; latching the fallback now would outlive it.
    if (driver.kind !== 'native' || token !== epoch || !attached) return;
    // No focused WebView (e.g. a Modal window on Android): fall back for good.
    useFallback = true;
    emit();
    await getFallbackDriver().suppress();
  };

  const settleOpen = (event: SystemKeyboardEvent | null) => {
    if (phase !== 'opening') return;
    phase = 'open';
    commitSlot(areaHeight(), event);
    emit();
    if (activeId !== undefined) options().onOpen?.(activeId);
  };

  const finishClose = () => {
    const token = epoch;
    microtask(() => {
      if (token !== epoch || phase !== 'closing') return;
      phase = 'closed';
      renderedId = undefined;
      slotHeight = 0;
      handedOver = false;
      emit();
      options().onClose?.();
    });
  };

  /**
   * The suppression did not take: no hide event arrived and the system
   * keyboard is still up. The keyboard events are confirmed with the
   * platform when the driver can ask it, since a missed event must not
   * count as a failure.
   */
  const suppressionFailed = async (token: number, driver: KeyboardDriver) => {
    const pending = () =>
      token === epoch && !hideSeen && (phase === 'opening' || phase === 'open');
    if (!pending() || !systemKeyboardUp()) return false;
    const visible = driver.isSystemKeyboardVisible
      ? await driver.isSystemKeyboardVisible().catch(() => true)
      : true;
    return visible && pending();
  };

  const verify = async (token: number, waited = VERIFY_TIMEOUT_MS) => {
    const failed = currentDriver();
    if (!(await suppressionFailed(token, failed))) return;
    if (!failed.isSystemKeyboardVisible && waited < EVENT_VERIFY_TIMEOUT_MS) {
      // Only the hide event can confirm the suppression: give it longer.
      schedule(EVENT_VERIFY_TIMEOUT_MS - waited, () => {
        void verify(token, EVENT_VERIFY_TIMEOUT_MS);
      });
      return;
    }
    reportError({ reason: 'verify-timeout', driver: failed.kind });
    if (failed.kind === 'native') {
      useFallback = true;
      emit();
      void failed.release().then(() => {
        if (token !== epoch) return;
        void getFallbackDriver().suppress();
        schedule(VERIFY_TIMEOUT_MS, () => void verify(token));
      });
      return;
    }
    // Neither driver could hide the system keyboard: give the area back to
    // it. A slow device may still be hiding it, so it is shown again.
    handOver(null);
  };

  const beginSuppression = async (token: number) => {
    let driver = currentDriver();
    if (driver.kind !== 'inline' && !channel.isFocused()) {
      // Latch first so focusing never flashes the system keyboard.
      channel.injectScript(INPUT_MODE_SUPPRESS_SCRIPT);
      latchApplied = true;
      channel.focus();
      await waitForFocus(true);
      if (token !== epoch) return;
      driver = currentDriver();
    }
    const systemWasUp = systemKeyboardUp();
    suppressed = true;
    if (systemWasUp) {
      schedule(EVENT_TIMEOUT_MS, () => settleOpen(null));
      schedule(VERIFY_TIMEOUT_MS, () => void verify(token));
    }
    await suppressWith(driver, token);
    if (token !== epoch) return;
    if (!systemWasUp) settleOpen(null);
  };

  /**
   * Ends the custom keyboard after a system keyboard took the area: the
   * keyboard of `event`, or with no event the one a failed suppression left
   * up, which is restored in case its hide was only late.
   */
  const handOver = (event: SystemKeyboardEvent | null) => {
    const token = ++epoch;
    clearTimers();
    phase = 'closing';
    closingToSystem = true;
    handedOver = true;
    activeId = undefined;
    suppressed = false;
    unlatch();
    if (event) void currentDriver().release();
    else restoreSystemKeyboard(currentDriver(), token);
    commitSlot(0, event);
    emit();
    notifyParent(undefined);
    options().onSystemKeyboardReturn?.();
    if (event && event.name === 'keyboardDidShow') finishClose();
    else schedule(SHOW_CONFIRM_TIMEOUT_MS, finishClose);
  };

  const onSystemEvent = (event: SystemKeyboardEvent) => {
    switch (phase) {
      case 'opening':
        if (!hideSeen && isHideEvent(event)) {
          hideSeen = true;
          clearTimers();
          settleOpen(event);
        }
        break;
      case 'open':
        // Another input took focus, or the suppression stopped working.
        if (isShowEvent(event)) handOver(event);
        break;
      case 'closing':
        if (!closingToSystem) break;
        if (!handedOver && isShowEvent(event)) {
          handedOver = true;
          commitSlot(0, event);
          emit();
          options().onSystemKeyboardReturn?.();
        }
        if (event.name === 'keyboardDidShow') finishClose();
        break;
      default:
        break;
    }
  };

  const open = (id: string) => {
    if (!attached) return;
    if (phase === 'opening' || phase === 'open') {
      if (id === activeId) return;
      // Switching keyboards swaps the body only: no driver calls, no animation.
      activeId = id;
      renderedId = id;
      keyboardHeight = options().heightOf(id) ?? keyboardHeight;
      if (phase === 'open') slotHeight = areaHeight();
      emit();
      notifyParent(id);
      return;
    }
    const token = ++epoch;
    clearTimers();
    phase = 'opening';
    activeId = id;
    renderedId = id;
    hideSeen = false;
    handedOver = false;
    closingToSystem = false;
    if (nativeDriver && !deps.forceFallback) {
      // A mode the window lacked focus for at mount, and the inset of the
      // current orientation and navigation mode.
      requestOverlayMode(nativeDriver);
      refreshNavigationBarInset(nativeDriver);
    }
    keyboardHeight =
      options().heightOf(id) ??
      store.getKeyboardHeight(options().defaultHeight);
    emit();
    notifyParent(id);
    void beginSuppression(token);
  };

  const dismiss = (blurred = false) => {
    if (phase === 'closed') return;
    const token = ++epoch;
    clearTimers();
    const wasSuppressed = suppressed;
    phase = 'closing';
    closingToSystem = false;
    handedOver = true;
    activeId = undefined;
    suppressed = false;
    commitSlot(0, null);
    emit();
    notifyParent(undefined);
    schedule(SLOT_ANIMATION_MS, finishClose);
    if (!wasSuppressed && !latchApplied) return;
    // The editor would show the system keyboard again if it kept focus: on
    // iOS whenever the suppression ends, and on both platforms while the
    // keyboard's own focus call of an unfocused open is still in flight.
    const blurFirst =
      !blurred && (!wasSuppressed || (isIOS && channel.isFocused()));
    void (async () => {
      if (blurFirst) {
        channel.blur();
        await waitForFocus(false);
        if (token !== epoch) return;
      }
      unlatch();
      await currentDriver().release();
    })();
  };

  const close = (toSystem = true) => {
    if (phase === 'closed' || phase === 'closing') return;
    if (!toSystem) {
      dismiss();
      return;
    }
    const token = ++epoch;
    clearTimers();
    phase = 'closing';
    closingToSystem = true;
    handedOver = false;
    activeId = undefined;
    suppressed = false;
    emit();
    notifyParent(undefined);
    const driver = currentDriver();
    if (driver.kind === 'inline') {
      handedOver = true;
      commitSlot(0, null);
      emit();
      finishClose();
      return;
    }
    schedule(EVENT_TIMEOUT_MS, () => {
      if (handedOver) return;
      handedOver = true;
      commitSlot(0, null);
      emit();
    });
    schedule(SHOW_CONFIRM_TIMEOUT_MS, finishClose);
    unlatch();
    restoreSystemKeyboard(driver, token);
  };

  const restoreSystemKeyboard = (driver: KeyboardDriver, token: number) => {
    void driver
      .restore()
      .then((restored) => {
        if (!restored && token === epoch) showSystemKeyboard(driver);
      })
      .catch((error: unknown) => {
        reportError({ reason: 'native-error', driver: driver.kind, error });
      });
  };

  /**
   * `restore()` found no focused WebView (Android), so the IME did not come
   * back: focus the editor again and show the IME for it.
   */
  const showSystemKeyboard = (driver: KeyboardDriver) => {
    const show = driver.showSystemKeyboard;
    if (!show) return;
    channel.focus();
    schedule(REFOCUS_DELAY_MS, () => {
      void show().catch(() => false);
    });
  };

  /** The WebView reloaded: the page lost its state, start over closed. */
  const reset = () => {
    if (phase === 'closed') return;
    epoch++;
    clearTimers();
    phase = 'closed';
    activeId = undefined;
    renderedId = undefined;
    slotHeight = 0;
    handedOver = false;
    suppressed = false;
    latchApplied = false;
    void currentDriver().release();
    emit();
    notifyParent(undefined);
    options().onClose?.();
  };

  const controls: CustomKeyboardControls = {
    get activeKeyboardID() {
      return activeId;
    },
    open,
    close,
    dismiss: () => dismiss(),
  };

  /** Applies Android's `'stable'` window mode once per host. */
  const requestOverlayMode = (driver: KeyboardDriver) => {
    if (platform !== 'android' || options().androidKeyboardMode !== 'stable') {
      return;
    }
    if (overlayApplied || overlayRequested) return;
    overlayRequested = true;
    overlayRequests++;
    const settle = (applied: boolean) => {
      overlayRequested = false;
      overlayRequests--;
      if (!applied) return;
      if (attached) {
        overlayApplied = true;
        overlayHosts++;
        emit();
      } else if (overlayHosts === 0 && overlayRequests === 0) {
        // Detached while in flight, and no other host holds the mode.
        void driver.setWindowOverlayMode(false).catch(() => false);
      }
    };
    void driver.setWindowOverlayMode(true).then(settle, () => settle(false));
  };

  const refreshNavigationBarInset = (driver: KeyboardDriver) => {
    void driver
      .getNavigationBarInset()
      .then((inset) => {
        if (!attached) return;
        store.setEdgeToEdge(inset > 0);
        if (inset === navigationBarInset) return;
        navigationBarInset = inset;
        if (phase === 'open') slotHeight = areaHeight();
        emit();
      })
      .catch(() => {});
  };

  return {
    ...controls,
    get activeKeyboardID() {
      return activeId;
    },
    getView: () => view,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    sync(id) {
      controlledId = id;
      if (id === undefined) {
        if (phase === 'opening' || phase === 'open') close(true);
        return;
      }
      if (id !== activeId || phase === 'closing' || phase === 'closed') {
        open(id);
      }
    },
    attach() {
      if (attached) return;
      attached = true;
      host = store.registerHost(deps.editor, controls, hostState());
      unsubscribes = [
        store.subscribeEvents(onSystemEvent),
        channel.onFocusChange((focused) => {
          if (!focused && phase === 'open') dismiss(true);
        }),
        channel.onEditorPress(() => {
          if (!options().closeOnEditorPress) return;
          if (phase === 'opening' || phase === 'open') close(true);
        }),
        channel.onExternalFocus(() => {
          if (phase === 'opening' || phase === 'open') close(true);
        }),
        channel.onReload(reset),
      ];
      const backHandler = deps.backHandler;
      if (backHandler && platform === 'android') {
        const subscription = backHandler.addEventListener(
          'hardwareBackPress',
          () => {
            if (phase !== 'opening' && phase !== 'open') return false;
            dismiss();
            return true;
          }
        );
        unsubscribes.push(() => subscription.remove());
      }
      channel.setPersistentScript(
        PRESS_LISTENER_SCRIPT_KEY,
        pressListenerScript(true)
      );
      if (nativeDriver && !deps.forceFallback) {
        requestOverlayMode(nativeDriver);
        refreshNavigationBarInset(nativeDriver);
      }
    },
    detach() {
      if (!attached) return;
      attached = false;
      epoch++;
      clearTimers();
      unsubscribes.forEach((unsubscribe) => unsubscribe());
      unsubscribes = [];
      const driver = currentDriver();
      if (phase !== 'closed' || suppressed || latchApplied) {
        unlatch();
        void driver.release();
      }
      channel.setPersistentScript(PRESS_LISTENER_SCRIPT_KEY, null);
      channel.injectScript(pressListenerScript(false));
      if (overlayApplied && nativeDriver) {
        overlayApplied = false;
        overlayHosts--;
        if (overlayHosts === 0 && overlayRequests === 0) {
          void nativeDriver.setWindowOverlayMode(false).catch(() => false);
        }
      }
      phase = 'closed';
      activeId = undefined;
      renderedId = undefined;
      slotHeight = 0;
      handedOver = false;
      suppressed = false;
      host?.unregister();
      host = undefined;
      view = buildView();
      listeners.forEach((listener) => listener());
    },
  };
}

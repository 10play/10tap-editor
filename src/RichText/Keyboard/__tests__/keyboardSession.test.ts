import {
  ANDROID_SHOW_SETTLE_MS,
  createKeyboardStore,
} from '../../../native/keyboardStore';
import { PROTOCOL_TYPES } from '../../../shared/protocol';
import {
  INPUT_MODE_SCRIPT_KEY,
  REFOCUS_DELAY_MS,
  type NativeKeyboardModule,
} from '../drivers';
import { createEditorChannel } from '../editorChannel';
import {
  ANDROID_BLUR_GRACE_MS,
  EVENT_TIMEOUT_MS,
  EVENT_VERIFY_TIMEOUT_MS,
  FOCUS_TIMEOUT_MS,
  PRESS_LISTENER_SCRIPT_KEY,
  SHOW_CONFIRM_TIMEOUT_MS,
  SLOT_ANIMATION_MS,
  VERIFY_TIMEOUT_MS,
  createKeyboardSession,
  type KeyboardSessionOptions,
} from '../keyboardSession';
import {
  INPUT_MODE_RESTORE_SCRIPT,
  INPUT_MODE_SUPPRESS_SCRIPT,
  pressListenerScript,
} from '../webSnippets';
import {
  IOS_ANIMATION,
  createFakeBackHandler,
  createFakeEditor,
  createFakeKeyboard,
  createFakeLayoutAnimation,
  createFakeNativeModule,
  flush,
  type FakeNativeModule,
} from './fakes';

const WINDOW = { width: 390, height: 844 };

interface SetupOptions {
  platform?: 'ios' | 'android' | 'web';
  native?: FakeNativeModule | null;
  /** Height of the system keyboard already up when the test starts; 0 for none. */
  systemKeyboard?: number;
  focused?: boolean;
  forceFallback?: boolean;
  withController?: boolean;
  /** Whether the editor finished loading before the keyboard mounted. */
  ready?: boolean;
  options?: Partial<KeyboardSessionOptions>;
}

const setup = ({
  platform = 'ios',
  native = createFakeNativeModule(),
  systemKeyboard = 300,
  focused = true,
  forceFallback = false,
  withController = true,
  ready = true,
  options = {},
}: SetupOptions = {}) => {
  const keyboard = createFakeKeyboard();
  let windowSize = WINDOW;
  const windowListeners = new Set<() => void>();
  const store = createKeyboardStore({
    keyboard,
    getWindowSize: () => windowSize,
    platform,
  });
  const fake = createFakeEditor({ focused, withController });
  fake.controller.ready = ready;
  const { layoutAnimation, configureNext } = createFakeLayoutAnimation();
  const back = createFakeBackHandler();
  const hiddenInput = { focus: jest.fn() };
  const sessionOptions: KeyboardSessionOptions = {
    closeOnEditorPress: true,
    androidKeyboardMode: 'system',
    heightOf: () => undefined,
    onActiveKeyboardChange: jest.fn(),
    onOpen: jest.fn(),
    onClose: jest.fn(),
    onKeyboardError: jest.fn(),
    onSystemKeyboardReturn: jest.fn(),
    ...options,
  };
  const session = createKeyboardSession({
    platform,
    editor: fake.editor,
    channel: createEditorChannel(fake.editor),
    store,
    nativeModule: native as NativeKeyboardModule | null,
    forceFallback,
    getHiddenInput: () => hiddenInput,
    layoutAnimation,
    backHandler: back.backHandler,
    subscribeWindow: (listener) => {
      windowListeners.add(listener);
      return () => windowListeners.delete(listener);
    },
    getOptions: () => sessionOptions,
  });
  session.attach();

  const resizeWindow = (size: typeof WINDOW) => {
    windowSize = size;
    windowListeners.forEach((listener) => listener());
  };

  const showEvent = platform === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
  const showSystemKeyboard = (height: number) => {
    keyboard.emit(
      showEvent,
      height,
      platform === 'ios' ? IOS_ANIMATION : undefined
    );
    if (platform === 'ios') keyboard.emit('keyboardDidShow', height);
  };
  if (systemKeyboard) {
    showSystemKeyboard(systemKeyboard);
    // Up long enough to count as a keyboard (`ANDROID_SHOW_SETTLE_MS`).
    jest.advanceTimersByTime(ANDROID_SHOW_SETTLE_MS);
  }
  configureNext.mockClear();

  return {
    ...fake,
    platform,
    keyboard,
    store,
    session,
    native,
    configureNext,
    back,
    hiddenInput,
    resizeWindow,
    windowListeners,
    options: sessionOptions,
    view: () => session.getView(),
    snapshot: () => store.getSnapshot(),
  };
};

type Harness = ReturnType<typeof setup>;

/** Opens `id` and completes the platform's hide transition. */
const openFully = async (t: Harness, id = 'kb') => {
  t.session.open(id);
  await flush();
  if (t.snapshot().systemKeyboardHeight > 0) {
    if (t.platform === 'ios') {
      t.keyboard.emit('keyboardWillHide', 300, IOS_ANIMATION);
    } else {
      t.keyboard.emit('keyboardDidHide', 0);
    }
  }
  await flush();
  expect(t.view().phase).toBe('open');
  t.configureNext.mockClear();
  t.native?.setSystemKeyboardSuppressed.mockClear();
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('opening on iOS', () => {
  it('suppresses natively and fills the slot in the hide event batch', async () => {
    const t = setup();
    t.session.open('kb');

    expect(t.view()).toMatchObject({
      phase: 'opening',
      renderedKeyboardID: 'kb',
      slotHeight: 0,
      keyboardHeight: 300,
      driver: 'native',
    });
    expect(t.options.onActiveKeyboardChange).toHaveBeenCalledWith('kb');
    await flush();
    expect(t.native!.setSystemKeyboardSuppressed).toHaveBeenCalledWith(true);

    t.keyboard.emit('keyboardWillHide', 300, IOS_ANIMATION);
    // The slot follows in a microtask, the same batch as the KAV padding.
    expect(t.view().slotHeight).toBe(0);
    await flush();
    expect(t.view()).toMatchObject({ phase: 'open', slotHeight: 300 });
    expect(t.configureNext).toHaveBeenCalledTimes(1);
    expect(t.configureNext).toHaveBeenCalledWith({
      duration: 250,
      update: { duration: 250, type: 'keyboard' },
    });
    expect(t.options.onOpen).toHaveBeenCalledWith('kb');
  });

  it('treats a near-zero keyboardWillShow as the hide event', async () => {
    const t = setup();
    t.session.open('kb');
    await flush();
    t.keyboard.emit('keyboardWillChangeFrame', 0, IOS_ANIMATION);
    await flush();
    expect(t.view()).toMatchObject({ phase: 'open', slotHeight: 300 });
  });

  it('keeps useKeyboard at the keyboard height through the swap', async () => {
    const t = setup();
    expect(t.snapshot()).toMatchObject({
      isKeyboardUp: true,
      keyboardHeight: 300,
    });
    t.session.open('kb');
    expect(t.snapshot()).toMatchObject({
      isKeyboardUp: true,
      keyboardHeight: 300,
      isCustomKeyboardOpen: true,
      activeCustomKeyboardID: 'kb',
    });
    await flush();
    t.keyboard.emit('keyboardWillHide', 300, IOS_ANIMATION);
    expect(t.snapshot()).toMatchObject({
      systemKeyboardHeight: 0,
      isKeyboardUp: true,
      keyboardHeight: 300,
    });
    t.keyboard.emit('keyboardDidHide', 300);
    await flush();
    expect(t.snapshot().keyboardHeight).toBe(300);

    t.session.close();
    await flush();
    expect(t.snapshot()).toMatchObject({
      isKeyboardUp: true,
      keyboardHeight: 300,
    });
    t.keyboard.emit('keyboardWillShow', 300, IOS_ANIMATION);
    expect(t.snapshot()).toMatchObject({
      isKeyboardUp: true,
      keyboardHeight: 300,
      isCustomKeyboardOpen: false,
      systemKeyboardHeight: 300,
    });
  });
});

describe('opening on Android', () => {
  it('fills the slot on keyboardDidHide without an animation', async () => {
    const t = setup({ platform: 'android', systemKeyboard: 280 });
    t.session.open('kb');
    await flush();
    expect(t.native!.setSystemKeyboardSuppressed).toHaveBeenCalledWith(true);
    t.keyboard.emit('keyboardDidHide', 0);
    expect(t.view().slotHeight).toBe(0);
    await flush();
    expect(t.view()).toMatchObject({ phase: 'open', slotHeight: 280 });
    expect(t.configureNext).not.toHaveBeenCalled();
  });
});

describe('opening without a system keyboard event', () => {
  it('animates the slot itself when no keyboard is up (hardware keyboard)', async () => {
    const t = setup({ systemKeyboard: 0, options: { defaultHeight: 260 } });
    t.session.open('kb');
    expect(t.view().keyboardHeight).toBe(260);
    await flush();
    expect(t.view()).toMatchObject({ phase: 'open', slotHeight: 260 });
    expect(t.configureNext).toHaveBeenCalledWith({
      duration: SLOT_ANIMATION_MS,
      update: { duration: SLOT_ANIMATION_MS, type: 'keyboard' },
    });
  });

  it('ignores the iPad shortcut bar', async () => {
    const t = setup({ systemKeyboard: 55 });
    t.session.open('kb');
    await flush();
    expect(t.view().phase).toBe('open');
  });

  it('falls back to a share of the window height before any keyboard was seen', () => {
    const t = setup({ systemKeyboard: 0 });
    t.session.open('kb');
    expect(t.view().keyboardHeight).toBe(Math.round(0.38 * WINDOW.height));
  });

  it('prefers the extension height', () => {
    const t = setup({ options: { heightOf: () => 200 } });
    t.session.open('kb');
    expect(t.view().keyboardHeight).toBe(200);
  });

  it('animates the slot after the event timeout when the keyboard stays silent', async () => {
    const t = setup();
    t.session.open('kb');
    await flush();
    jest.advanceTimersByTime(EVENT_TIMEOUT_MS);
    await flush();
    expect(t.view()).toMatchObject({ phase: 'open', slotHeight: 300 });
    expect(t.configureNext).toHaveBeenCalledTimes(1);
  });
});

describe('verification and driver selection', () => {
  it('switches to the fallback driver when the keyboard is still up after 600 ms', async () => {
    const t = setup();
    t.session.open('kb');
    await flush();
    jest.advanceTimersByTime(VERIFY_TIMEOUT_MS);
    await flush();

    expect(t.options.onKeyboardError).toHaveBeenCalledWith({
      reason: 'verify-timeout',
      driver: 'native',
    });
    expect(t.native!.setSystemKeyboardSuppressed).toHaveBeenLastCalledWith(
      false
    );
    expect(t.view().driver).toBe('fallback');
    expect(t.controller.persistent.get(INPUT_MODE_SCRIPT_KEY)).toBe(
      INPUT_MODE_SUPPRESS_SCRIPT
    );
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('gives up and hands the area back when the fallback fails too', async () => {
    const t = setup();
    t.session.open('kb');
    await flush();
    jest.advanceTimersByTime(VERIFY_TIMEOUT_MS);
    await flush();
    jest.advanceTimersByTime(VERIFY_TIMEOUT_MS);
    await flush();
    expect(t.options.onKeyboardError).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(EVENT_VERIFY_TIMEOUT_MS - VERIFY_TIMEOUT_MS);
    await flush();
    expect(t.options.onKeyboardError).toHaveBeenLastCalledWith({
      reason: 'verify-timeout',
      driver: 'fallback',
    });
    expect(t.view().phase).toBe('closing');
    expect(t.options.onActiveKeyboardChange).toHaveBeenLastCalledWith(
      undefined
    );
    jest.advanceTimersByTime(SHOW_CONFIRM_TIMEOUT_MS);
    await flush();
    expect(t.view()).toMatchObject({ phase: 'closed', slotHeight: 0 });
  });

  it('Android fallback: shows the IME again after a late hide', async () => {
    const t = setup({ platform: 'android', native: null, systemKeyboard: 280 });
    t.session.open('kb');
    await flush();
    jest.advanceTimersByTime(VERIFY_TIMEOUT_MS);
    await flush();
    jest.advanceTimersByTime(EVENT_VERIFY_TIMEOUT_MS - VERIFY_TIMEOUT_MS);
    await flush();
    expect(t.options.onKeyboardError).toHaveBeenCalledWith({
      reason: 'verify-timeout',
      driver: 'fallback',
    });
    expect(t.controller.persistent.has(INPUT_MODE_SCRIPT_KEY)).toBe(false);

    // The suppression's hide lands only now, on a loaded device.
    t.keyboard.emit('keyboardDidHide', 0);
    expect(t.hiddenInput.focus).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(REFOCUS_DELAY_MS);
    await flush();
    expect(t.editor.focus).toHaveBeenCalled();
  });

  it('Android fallback: waits for an IME that takes over a second to hide', async () => {
    const t = setup({ platform: 'android', native: null, systemKeyboard: 280 });
    t.session.open('kb');
    await flush();
    jest.advanceTimersByTime(1300);
    await flush();
    t.keyboard.emit('keyboardDidHide', 0);
    jest.advanceTimersByTime(EVENT_VERIFY_TIMEOUT_MS);
    await flush();
    expect(t.options.onKeyboardError).not.toHaveBeenCalled();
    expect(t.view()).toMatchObject({ phase: 'open', driver: 'fallback' });
    expect(t.hiddenInput.focus).not.toHaveBeenCalled();
  });

  it('Android Modal: waits for the hide when the native driver could not suppress', async () => {
    const t = setup({
      platform: 'android',
      native: createFakeNativeModule({ suppressResult: false }),
      systemKeyboard: 280,
    });
    t.session.open('kb');
    await flush();
    expect(t.view().driver).toBe('fallback');
    jest.advanceTimersByTime(VERIFY_TIMEOUT_MS + 500);
    await flush();
    t.keyboard.emit('keyboardDidHide', 0);
    jest.advanceTimersByTime(EVENT_VERIFY_TIMEOUT_MS);
    await flush();
    expect(t.options.onKeyboardError).not.toHaveBeenCalled();
    expect(t.view()).toMatchObject({ phase: 'open', activeKeyboardID: 'kb' });
  });

  it('does not fail verification once the hide event arrived', async () => {
    const t = setup();
    await openFully(t);
    jest.advanceTimersByTime(VERIFY_TIMEOUT_MS * 2);
    expect(t.options.onKeyboardError).not.toHaveBeenCalled();
  });

  it('keeps the native driver when the platform reports the keyboard hidden', async () => {
    const t = setup({
      native: createFakeNativeModule({ systemKeyboardVisible: false }),
    });
    t.session.open('kb');
    await flush();
    jest.advanceTimersByTime(VERIFY_TIMEOUT_MS);
    await flush();
    expect(t.native!.isSystemKeyboardVisible).toHaveBeenCalledTimes(1);
    expect(t.options.onKeyboardError).not.toHaveBeenCalled();
    expect(t.view()).toMatchObject({ phase: 'open', driver: 'native' });
  });

  it('does not ask the platform once the hide event arrived', async () => {
    const t = setup();
    await openFully(t);
    jest.advanceTimersByTime(VERIFY_TIMEOUT_MS);
    await flush();
    expect(t.native!.isSystemKeyboardVisible).not.toHaveBeenCalled();
  });

  it('uses the fallback right away when the native call resolves false', async () => {
    const t = setup({
      native: createFakeNativeModule({ suppressResult: false }),
    });
    t.session.open('kb');
    await flush();
    expect(t.view().driver).toBe('fallback');
    expect(t.controller.persistent.get(INPUT_MODE_SCRIPT_KEY)).toBe(
      INPUT_MODE_SUPPRESS_SCRIPT
    );
    expect(t.options.onKeyboardError).not.toHaveBeenCalled();
  });

  it.each(['close', 'detach'] as const)(
    'does not latch the fallback after a %s during the native call',
    async (end) => {
      const native = createFakeNativeModule();
      let settle: (suppressed: boolean) => void = () => {};
      native.setSystemKeyboardSuppressed.mockImplementationOnce(
        () => new Promise<boolean>((resolve) => (settle = resolve))
      );
      const t = setup({ platform: 'android', native });
      t.session.open('kb');
      await flush();

      if (end === 'close') t.session.close();
      else t.session.detach();
      settle(false);
      await flush();

      expect(t.controller.persistent.get(INPUT_MODE_SCRIPT_KEY)).not.toBe(
        INPUT_MODE_SUPPRESS_SCRIPT
      );
      expect(t.view().driver).toBe('native');
    }
  );

  it('retries the native driver after it failed for an unfocused editor', async () => {
    const native = createFakeNativeModule();
    native.setSystemKeyboardSuppressed.mockResolvedValueOnce(false);
    const t = setup({ native, focused: false, systemKeyboard: 0 });
    t.session.open('kb');
    jest.advanceTimersByTime(FOCUS_TIMEOUT_MS);
    await flush();
    expect(t.view().driver).toBe('fallback');

    t.session.close(false);
    jest.advanceTimersByTime(SLOT_ANIMATION_MS);
    await flush();
    t.setFocused(true);
    native.setSystemKeyboardSuppressed.mockClear();
    t.session.open('kb');
    await flush();

    expect(native.setSystemKeyboardSuppressed).toHaveBeenCalledWith(true);
    expect(t.view().driver).toBe('native');
  });

  it.each([
    ['retries the native driver after one failure', [false, true], 'native'],
    ['falls back for good after repeated failures', [false, false], 'fallback'],
  ] as const)(
    'focused editor without a focused WebView: %s',
    async (_name, results, expected) => {
      const native = createFakeNativeModule();
      const t = setup({ platform: 'android', native, systemKeyboard: 0 });
      const reopen = async (suppressed: boolean) => {
        native.setSystemKeyboardSuppressed.mockResolvedValueOnce(suppressed);
        t.session.open('kb');
        await flush();
        t.session.close(false);
        jest.advanceTimersByTime(SLOT_ANIMATION_MS);
        await flush();
      };
      for (const suppressed of results) await reopen(suppressed);
      native.setSystemKeyboardSuppressed.mockClear();

      t.session.open('kb');
      await flush();

      expect(t.view().driver).toBe(expected);
      expect(native.setSystemKeyboardSuppressed).toHaveBeenCalledTimes(
        expected === 'native' ? 1 : 0
      );
    }
  );

  it('reports a rejected native call and falls back', async () => {
    const native = createFakeNativeModule();
    native.setSystemKeyboardSuppressed.mockRejectedValueOnce(new Error('boom'));
    const t = setup({ native });
    t.session.open('kb');
    await flush();
    expect(t.options.onKeyboardError).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'native-error', driver: 'native' })
    );
    expect(t.view().driver).toBe('fallback');
  });

  it('selects the fallback driver without the native module', async () => {
    const t = setup({ native: null });
    expect(t.view().driver).toBe('fallback');
    t.session.open('kb');
    await flush();
    expect(t.controller.persistent.get(INPUT_MODE_SCRIPT_KEY)).toBe(
      INPUT_MODE_SUPPRESS_SCRIPT
    );
  });

  it('honours forceFallback', () => {
    const t = setup({ forceFallback: true });
    expect(t.view().driver).toBe('fallback');
  });

  it('renders inline without suppression on web', async () => {
    const t = setup({ platform: 'web', systemKeyboard: 0 });
    expect(t.view().driver).toBe('inline');
    t.session.open('kb');
    await flush();
    expect(t.view().phase).toBe('open');
    expect(t.native!.setSystemKeyboardSuppressed).not.toHaveBeenCalled();
    t.session.close();
    await flush();
    expect(t.view().phase).toBe('closed');
  });
});

describe('closing to the system keyboard', () => {
  it('iOS: restores, empties the slot with the show event and keeps the body until didShow', async () => {
    const t = setup();
    await openFully(t);

    t.session.close();
    expect(t.options.onActiveKeyboardChange).toHaveBeenLastCalledWith(
      undefined
    );
    await flush();
    expect(t.native!.setSystemKeyboardSuppressed).toHaveBeenCalledWith(false);
    expect(t.view()).toMatchObject({
      phase: 'closing',
      activeKeyboardID: undefined,
      renderedKeyboardID: 'kb',
      slotHeight: 300,
    });

    t.keyboard.emit('keyboardWillShow', 300, IOS_ANIMATION);
    await flush();
    expect(t.view()).toMatchObject({
      phase: 'closing',
      slotHeight: 0,
      renderedKeyboardID: 'kb',
    });
    expect(t.configureNext).toHaveBeenCalledWith({
      duration: 250,
      update: { duration: 250, type: 'keyboard' },
    });
    expect(t.options.onSystemKeyboardReturn).toHaveBeenCalledTimes(1);

    t.keyboard.emit('keyboardDidShow', 300);
    await flush();
    expect(t.view()).toMatchObject({
      phase: 'closed',
      renderedKeyboardID: undefined,
    });
    expect(t.options.onClose).toHaveBeenCalledTimes(1);
  });

  it('unmounts the body after the ceiling when didShow never arrives', async () => {
    const t = setup();
    await openFully(t);
    t.session.close();
    t.keyboard.emit('keyboardWillShow', 300, IOS_ANIMATION);
    await flush();
    jest.advanceTimersByTime(SHOW_CONFIRM_TIMEOUT_MS - 1);
    await flush();
    expect(t.view().renderedKeyboardID).toBe('kb');
    jest.advanceTimersByTime(1);
    await flush();
    expect(t.view().phase).toBe('closed');
  });

  it('animates the slot itself without a show event (hardware keyboard)', async () => {
    const t = setup();
    await openFully(t);
    t.session.close();
    jest.advanceTimersByTime(EVENT_TIMEOUT_MS);
    await flush();
    expect(t.view().slotHeight).toBe(0);
    expect(t.configureNext).toHaveBeenCalledWith(
      expect.objectContaining({ duration: SLOT_ANIMATION_MS })
    );
  });

  it('Android: finishes on keyboardDidShow in one batch', async () => {
    const t = setup({ platform: 'android', systemKeyboard: 280 });
    await openFully(t);
    t.session.close();
    await flush();
    expect(t.native!.setSystemKeyboardSuppressed).toHaveBeenCalledWith(false);
    t.keyboard.emit('keyboardDidShow', 280);
    expect(t.view().slotHeight).toBe(280);
    await flush();
    expect(t.view()).toMatchObject({
      phase: 'closed',
      slotHeight: 0,
      renderedKeyboardID: undefined,
    });
    jest.advanceTimersByTime(REFOCUS_DELAY_MS);
    expect(t.native!.showSystemKeyboard).not.toHaveBeenCalled();
  });

  it('Android: keeps a keyboard up through the handover and stays closed after it', async () => {
    const t = setup({ platform: 'android', systemKeyboard: 280 });
    await openFully(t);
    const listener = jest.fn();
    t.session.subscribe(listener);
    t.session.close();
    await flush();
    // The body holds the area until the system keyboard is reported up.
    expect(t.snapshot()).toMatchObject({
      isKeyboardUp: true,
      isCustomKeyboardOpen: true,
      inlineKeyboardHeight: 280,
    });
    t.keyboard.emit('keyboardDidShow', 280);
    expect(t.snapshot()).toMatchObject({
      isKeyboardUp: true,
      isCustomKeyboardOpen: false,
      systemKeyboardHeight: 280,
    });
    await flush();
    expect(t.view().phase).toBe('closed');
    expect(t.snapshot().inlineKeyboardHeight).toBe(0);
    listener.mockClear();
    // The close's fallback timers do not touch the closed session.
    jest.advanceTimersByTime(SHOW_CONFIRM_TIMEOUT_MS);
    await flush();
    expect(listener).not.toHaveBeenCalled();
    expect(t.snapshot()).toMatchObject({
      isKeyboardUp: true,
      isCustomKeyboardOpen: false,
    });
  });

  it('Android: shows the IME again when no focused WebView was restored', async () => {
    const t = setup({
      platform: 'android',
      systemKeyboard: 280,
      native: createFakeNativeModule({ restoreResult: false }),
    });
    await openFully(t);
    t.session.close();
    await flush();
    const focusCommand = t.controller.commands.at(-1)!;
    expect(focusCommand.message.type).toBe('focus');
    expect(focusCommand.meta.internal).toBeDefined();
    expect(t.native!.showSystemKeyboard).not.toHaveBeenCalled();

    jest.advanceTimersByTime(REFOCUS_DELAY_MS);
    expect(t.native!.showSystemKeyboard).toHaveBeenCalledTimes(1);
    expect(t.view().phase).toBe('closing');
  });

  it('Android: does not show the IME for a restore that was superseded', async () => {
    const t = setup({
      platform: 'android',
      systemKeyboard: 280,
      native: createFakeNativeModule({ restoreResult: false }),
    });
    await openFully(t);
    t.session.close();
    t.session.open('kb');
    await flush();
    jest.advanceTimersByTime(REFOCUS_DELAY_MS);
    expect(t.native!.showSystemKeyboard).not.toHaveBeenCalled();
  });

  it('iOS: never forces the system keyboard after a restore', async () => {
    const t = setup({
      native: createFakeNativeModule({ restoreResult: false }),
    });
    await openFully(t);
    t.session.close();
    await flush();
    jest.advanceTimersByTime(REFOCUS_DELAY_MS);
    expect(t.native!.showSystemKeyboard).not.toHaveBeenCalled();
  });

  it('Android fallback: restores the IME through the hidden TextInput', async () => {
    const t = setup({ platform: 'android', native: null, systemKeyboard: 280 });
    await openFully(t);
    t.session.close();
    expect(t.controller.persistent.has(INPUT_MODE_SCRIPT_KEY)).toBe(false);
    expect(t.controller.injected).toContain(INPUT_MODE_RESTORE_SCRIPT);
    expect(t.hiddenInput.focus).toHaveBeenCalledTimes(1);
    expect(t.editor.focus).not.toHaveBeenCalled();

    jest.advanceTimersByTime(REFOCUS_DELAY_MS);
    await flush();
    expect(t.editor.focus).toHaveBeenCalledTimes(1);
    const focusCommand = t.controller.commands.at(-1)!;
    expect(focusCommand.message.type).toBe('focus');
    expect(focusCommand.meta.internal).toBeDefined();
    expect(t.view().phase).toBe('closing');
  });
});

describe('switching keyboards', () => {
  it('swaps only the body: no driver calls and no animation', async () => {
    const t = setup();
    await openFully(t, 'a');
    t.session.open('b');
    await flush();
    expect(t.view()).toMatchObject({
      phase: 'open',
      activeKeyboardID: 'b',
      renderedKeyboardID: 'b',
      slotHeight: 300,
    });
    expect(t.native!.setSystemKeyboardSuppressed).not.toHaveBeenCalled();
    expect(t.configureNext).not.toHaveBeenCalled();
    expect(t.options.onActiveKeyboardChange).toHaveBeenLastCalledWith('b');
    expect(t.snapshot().activeCustomKeyboardID).toBe('b');
  });

  it('gives a keyboard without a height the system height, not the previous one', async () => {
    const t = setup({
      options: { heightOf: (id) => (id === 'a' ? 200 : undefined) },
    });
    await openFully(t, 'a');
    expect(t.view().slotHeight).toBe(200);
    t.session.open('b');
    expect(t.view()).toMatchObject({ keyboardHeight: 300, slotHeight: 300 });
    expect(t.snapshot().keyboardHeight).toBe(300);
  });
});

describe('window size changes', () => {
  const LANDSCAPE = { width: WINDOW.height, height: WINDOW.width };

  it('resizes an open keyboard to the height seen in the new orientation', async () => {
    const t = setup();
    // A landscape system keyboard seen earlier.
    t.resizeWindow(LANDSCAPE);
    t.keyboard.emit('keyboardWillShow', 200, IOS_ANIMATION);
    t.keyboard.emit('keyboardWillHide', 200, IOS_ANIMATION);
    t.resizeWindow(WINDOW);
    t.keyboard.emit('keyboardWillShow', 300, IOS_ANIMATION);
    t.keyboard.emit('keyboardDidShow', 300);
    await openFully(t);
    expect(t.view().slotHeight).toBe(300);

    t.resizeWindow(LANDSCAPE);
    expect(t.view().keyboardHeight).toBe(200);
    await flush();
    expect(t.view().slotHeight).toBe(200);
    expect(t.snapshot().keyboardHeight).toBe(200);

    t.resizeWindow(WINDOW);
    await flush();
    expect(t.view()).toMatchObject({ keyboardHeight: 300, slotHeight: 300 });
  });

  it('keeps an extension height', async () => {
    const t = setup({ options: { heightOf: () => 220 } });
    await openFully(t);
    t.resizeWindow(LANDSCAPE);
    await flush();
    expect(t.view()).toMatchObject({ keyboardHeight: 220, slotHeight: 220 });
  });

  it('reads the navigation bar inset again', async () => {
    const native = createFakeNativeModule();
    const t = setup({ platform: 'android', native });
    await openFully(t);
    native.getNavigationBarInset.mockClear();
    native.getNavigationBarInset.mockResolvedValue(24);
    t.resizeWindow(LANDSCAPE);
    await flush();
    expect(native.getNavigationBarInset).toHaveBeenCalledTimes(1);
    expect(t.view().navigationBarInset).toBe(24);
  });

  it('ignores changes while closed and stops listening on detach', async () => {
    const t = setup();
    t.resizeWindow(LANDSCAPE);
    expect(t.view().keyboardHeight).toBe(0);
    t.session.detach();
    expect(t.windowListeners.size).toBe(0);
  });
});

describe('close triggers', () => {
  it('a tap in the editor closes to the system keyboard', async () => {
    const t = setup();
    await openFully(t);
    t.controller.receive(PROTOCOL_TYPES.EditorPress);
    expect(t.view().phase).toBe('closing');
    await flush();
    expect(t.native!.setSystemKeyboardSuppressed).toHaveBeenCalledWith(false);
  });

  it('ignores taps when closeOnEditorPress is false', async () => {
    const t = setup({ options: { closeOnEditorPress: false } });
    await openFully(t);
    t.controller.receive(PROTOCOL_TYPES.EditorPress);
    expect(t.view().phase).toBe('open');
  });

  it("the app's editor.focus() closes to the system keyboard", async () => {
    const t = setup();
    await openFully(t);
    t.editor.focus();
    expect(t.view().phase).toBe('closing');
  });

  it("the keyboard's own focus call does not close it", async () => {
    const t = setup({ focused: false, systemKeyboard: 0 });
    t.session.open('kb');
    expect(t.controller.injected).toContain(INPUT_MODE_SUPPRESS_SCRIPT);
    expect(t.editor.focus).toHaveBeenCalledTimes(1);
    expect(t.controller.commands[0]!.meta.internal).toBeDefined();
    expect(t.view().phase).toBe('opening');
    expect(t.native!.setSystemKeyboardSuppressed).not.toHaveBeenCalled();

    t.setFocused(true);
    await flush();
    expect(t.native!.setSystemKeyboardSuppressed).toHaveBeenCalledWith(true);
    expect(t.view().phase).toBe('open');

    // The latch comes off before the system keyboard is restored.
    t.session.close();
    expect(t.controller.injected.at(-1)).toBe(INPUT_MODE_RESTORE_SCRIPT);
  });

  it('suppresses after the focus timeout when no focus update arrives', async () => {
    const t = setup({ focused: false, systemKeyboard: 0 });
    t.session.open('kb');
    jest.advanceTimersByTime(300);
    await flush();
    expect(t.native!.setSystemKeyboardSuppressed).toHaveBeenCalledWith(true);
  });

  it('an editor blur dismisses without showing the system keyboard', async () => {
    const t = setup();
    await openFully(t);
    t.setFocused(false);
    expect(t.view()).toMatchObject({
      phase: 'closing',
      activeKeyboardID: undefined,
    });
    expect(t.options.onActiveKeyboardChange).toHaveBeenLastCalledWith(
      undefined
    );
    await flush();
    expect(t.editor.blur).not.toHaveBeenCalled();
    expect(t.native!.setSystemKeyboardSuppressed).toHaveBeenCalledWith(false);
    expect(t.view().slotHeight).toBe(0);
    expect(t.configureNext).toHaveBeenCalledWith(
      expect.objectContaining({ duration: SLOT_ANIMATION_MS })
    );
    jest.advanceTimersByTime(SLOT_ANIMATION_MS);
    await flush();
    expect(t.view()).toMatchObject({
      phase: 'closed',
      renderedKeyboardID: undefined,
    });
  });

  it('web: an editor blur keeps the keyboard open', async () => {
    // Clicking the toolbar item that opened it blurs the editor iframe.
    const t = setup({ platform: 'web', systemKeyboard: 0 });
    t.session.open('kb');
    await flush();
    t.setFocused(false);
    jest.advanceTimersByTime(ANDROID_BLUR_GRACE_MS);
    await flush();
    expect(t.view()).toMatchObject({ phase: 'open', activeKeyboardID: 'kb' });
    expect(t.options.onActiveKeyboardChange).toHaveBeenLastCalledWith('kb');

    // The app's focus call still closes it.
    t.editor.focus();
    await flush();
    expect(t.view().phase).toBe('closed');
  });

  it('an Android blur the editor recovers from keeps the keyboard open', async () => {
    const t = setup({ platform: 'android', systemKeyboard: 280 });
    await openFully(t);
    // A collapsed layout took the WebView's focus; the module gives it back.
    t.setFocused(false);
    jest.advanceTimersByTime(ANDROID_BLUR_GRACE_MS / 2);
    t.setFocused(true);
    jest.advanceTimersByTime(ANDROID_BLUR_GRACE_MS);
    await flush();
    expect(t.view()).toMatchObject({ phase: 'open', activeKeyboardID: 'kb' });
  });

  it('an Android blur that lasts dismisses the keyboard', async () => {
    const t = setup({ platform: 'android', systemKeyboard: 280 });
    await openFully(t);
    t.setFocused(false);
    expect(t.view().phase).toBe('open');
    jest.advanceTimersByTime(ANDROID_BLUR_GRACE_MS);
    await flush();
    expect(t.view()).toMatchObject({
      phase: 'closing',
      activeKeyboardID: undefined,
    });
  });

  it('dismiss() on iOS blurs the editor before ending the suppression', async () => {
    const t = setup();
    await openFully(t);
    t.session.dismiss();
    expect(t.editor.blur).toHaveBeenCalledTimes(1);
    await flush();
    expect(t.native!.setSystemKeyboardSuppressed).not.toHaveBeenCalled();
    t.setFocused(false);
    await flush();
    expect(t.native!.setSystemKeyboardSuppressed).toHaveBeenCalledWith(false);
    // The keyboard's own blur is not an app focus call.
    expect(t.view().phase).toBe('closing');
  });

  it('dismiss() during an unfocused open blurs before dropping the latch', async () => {
    const t = setup({ platform: 'android', focused: false, systemKeyboard: 0 });
    t.session.open('kb');
    expect(t.editor.focus).toHaveBeenCalledTimes(1);
    t.session.dismiss();
    expect(t.editor.blur).toHaveBeenCalledTimes(1);
    await flush();
    expect(t.controller.injected.at(-1)).toBe(INPUT_MODE_RESTORE_SCRIPT);
    t.setFocused(true);
    await flush();
    expect(t.native!.setSystemKeyboardSuppressed).not.toHaveBeenCalled();
    expect(t.view().phase).toBe('closing');
  });

  it('close(false) is a dismiss', async () => {
    const t = setup();
    await openFully(t);
    t.session.close(false);
    expect(t.editor.blur).toHaveBeenCalled();
  });

  it('another input bringing up the system keyboard hands the area over', async () => {
    const t = setup();
    await openFully(t);
    t.keyboard.emit('keyboardWillShow', 300, IOS_ANIMATION);
    expect(t.view().phase).toBe('closing');
    expect(t.options.onSystemKeyboardReturn).toHaveBeenCalledTimes(1);
    expect(t.options.onActiveKeyboardChange).toHaveBeenLastCalledWith(
      undefined
    );
    await flush();
    expect(t.view().slotHeight).toBe(0);
    expect(t.native!.setSystemKeyboardSuppressed).toHaveBeenCalledWith(false);
    t.keyboard.emit('keyboardDidShow', 300);
    await flush();
    expect(t.view().phase).toBe('closed');
  });

  it('Android: hands the area over once the system keyboard holds', async () => {
    const t = setup({ platform: 'android', systemKeyboard: 280 });
    await openFully(t);
    t.keyboard.emit('keyboardDidShow', 280);
    await flush();
    expect(t.view().phase).toBe('open');
    jest.advanceTimersByTime(ANDROID_SHOW_SETTLE_MS);
    await flush();
    expect(t.native!.isSystemKeyboardVisible).toHaveBeenCalled();
    expect(t.view()).toMatchObject({ phase: 'closed', slotHeight: 0 });
    expect(t.options.onSystemKeyboardReturn).toHaveBeenCalledTimes(1);
    expect(t.options.onActiveKeyboardChange).toHaveBeenLastCalledWith(
      undefined
    );
  });

  it('Android: stays open through a keyboard reported during a rotation', async () => {
    const t = setup({ platform: 'android', systemKeyboard: 280 });
    await openFully(t);
    // Before API 30 React Native compares the root view with the visible
    // frame, which disagree while the window changes size.
    t.keyboard.emit('keyboardDidShow', 232);
    t.resizeWindow({ width: WINDOW.height, height: WINDOW.width });
    jest.advanceTimersByTime(21);
    t.keyboard.emit('keyboardDidHide', 0);
    jest.advanceTimersByTime(ANDROID_SHOW_SETTLE_MS);
    await flush();
    expect(t.view()).toMatchObject({ phase: 'open', activeKeyboardID: 'kb' });
    expect(t.options.onSystemKeyboardReturn).not.toHaveBeenCalled();
    expect(t.native!.setSystemKeyboardSuppressed).not.toHaveBeenCalledWith(
      false
    );
    // The bogus height was not taken for the portrait keyboard.
    t.resizeWindow(WINDOW);
    expect(t.view().keyboardHeight).toBe(280);
  });

  it('Android: stays open when the platform shows no system keyboard', async () => {
    const t = setup({ platform: 'android', systemKeyboard: 280 });
    await openFully(t);
    t.native!.isSystemKeyboardVisible.mockResolvedValue(false);
    t.keyboard.emit('keyboardDidShow', 280);
    jest.advanceTimersByTime(ANDROID_SHOW_SETTLE_MS);
    await flush();
    expect(t.view().phase).toBe('open');
    expect(t.options.onSystemKeyboardReturn).not.toHaveBeenCalled();
  });

  it('Android back dismisses and is consumed only while open', async () => {
    const t = setup({ platform: 'android', systemKeyboard: 280 });
    expect(t.back.press()).toBe(false);
    await openFully(t);
    expect(t.back.press()).toBe(true);
    expect(t.view().phase).toBe('closing');
    await flush();
    // Only the latch comes off: no native restore, which would show the IME.
    expect(t.native!.setSystemKeyboardSuppressed).not.toHaveBeenCalled();
    expect(t.controller.injected.at(-1)).toBe(INPUT_MODE_RESTORE_SCRIPT);
    expect(t.editor.blur).not.toHaveBeenCalled();
  });

  it('a WebView reload closes and resets', async () => {
    const t = setup({ native: null });
    await openFully(t);
    t.controller.reload();
    expect(t.view()).toMatchObject({
      phase: 'closed',
      slotHeight: 0,
      renderedKeyboardID: undefined,
    });
    expect(t.controller.persistent.has(INPUT_MODE_SCRIPT_KEY)).toBe(false);
    expect(t.controller.injected.at(-1)).toBe(INPUT_MODE_RESTORE_SCRIPT);
    expect(t.options.onClose).toHaveBeenCalledTimes(1);
    expect(t.options.onActiveKeyboardChange).toHaveBeenLastCalledWith(
      undefined
    );
  });

  it('the first ready is not a reload', () => {
    const t = setup({ ready: false });
    t.session.open('kb');
    t.controller.setReady(true);
    expect(t.view().phase).toBe('opening');
  });

  it('activeKeyboardID set to undefined closes to the system keyboard', async () => {
    const t = setup();
    t.session.sync('kb');
    expect(t.options.onActiveKeyboardChange).not.toHaveBeenCalled();
    await flush();
    t.keyboard.emit('keyboardWillHide', 300, IOS_ANIMATION);
    await flush();
    t.session.sync(undefined);
    expect(t.view().phase).toBe('closing');
    expect(t.options.onActiveKeyboardChange).not.toHaveBeenCalled();
    await flush();
    expect(t.native!.setSystemKeyboardSuppressed).toHaveBeenLastCalledWith(
      false
    );
  });

  it('reopening while closing suppresses again', async () => {
    const t = setup();
    await openFully(t);
    t.session.close();
    t.session.open('kb');
    expect(t.view().phase).toBe('opening');
    await flush();
    expect(t.native!.setSystemKeyboardSuppressed).toHaveBeenLastCalledWith(
      true
    );
  });
});

describe('teardown', () => {
  it('releases everything once, however often it runs', async () => {
    const t = setup();
    await openFully(t);
    t.session.detach();
    await flush();

    expect(t.native!.setSystemKeyboardSuppressed).toHaveBeenCalledTimes(1);
    expect(t.native!.setSystemKeyboardSuppressed).toHaveBeenCalledWith(false);
    expect(t.controller.persistent.has(PRESS_LISTENER_SCRIPT_KEY)).toBe(false);
    expect(t.controller.injected.at(-1)).toBe(pressListenerScript(false));
    expect(t.keyboard.listenerCount()).toBe(0);
    expect(t.back.count()).toBe(0);
    expect(t.view()).toMatchObject({ phase: 'closed', slotHeight: 0 });
    expect(t.snapshot().isCustomKeyboardOpen).toBe(false);
    expect(t.store.getHost()).toBeUndefined();
    // Unmounting never writes back into the parent's state.
    expect(t.options.onActiveKeyboardChange).toHaveBeenCalledTimes(1);

    t.session.detach();
    await flush();
    expect(t.native!.setSystemKeyboardSuppressed).toHaveBeenCalledTimes(1);
  });

  it('resets the fallback latch', async () => {
    const t = setup({ native: null });
    await openFully(t);
    t.session.detach();
    expect(t.controller.persistent.size).toBe(0);
    expect(t.controller.injected).toContain(INPUT_MODE_RESTORE_SCRIPT);
  });

  it("restores the window mode in Android 'stable' mode", async () => {
    const t = setup({
      platform: 'android',
      systemKeyboard: 280,
      options: { androidKeyboardMode: 'stable' },
    });
    await flush();
    expect(t.native!.setWindowOverlayMode).toHaveBeenCalledWith(true);
    expect(t.snapshot().windowOverlaysKeyboard).toBe(true);
    t.session.detach();
    expect(t.native!.setWindowOverlayMode).toHaveBeenLastCalledWith(false);
    expect(t.snapshot().windowOverlaysKeyboard).toBe(false);
  });

  it("restores the window mode only when the last 'stable' host detaches", async () => {
    const native = createFakeNativeModule();
    const stable = () =>
      setup({
        platform: 'android',
        native,
        systemKeyboard: 280,
        options: { androidKeyboardMode: 'stable' },
      });
    const first = stable();
    const second = stable();
    await flush();

    second.session.detach();
    expect(native.setWindowOverlayMode).not.toHaveBeenCalledWith(false);
    first.session.detach();
    expect(native.setWindowOverlayMode).toHaveBeenLastCalledWith(false);
  });

  it("never touches the window mode in 'system' mode", async () => {
    const t = setup({ platform: 'android', systemKeyboard: 280 });
    await flush();
    t.session.detach();
    expect(t.native!.setWindowOverlayMode).not.toHaveBeenCalled();
  });

  it('restores a window mode applied after unmount', async () => {
    const t = setup({
      platform: 'android',
      options: { androidKeyboardMode: 'stable' },
    });
    t.session.detach();
    await flush();
    expect(t.native!.setWindowOverlayMode.mock.calls).toEqual([
      [true],
      [false],
    ]);
  });

  it("counts a 'stable' host once across a StrictMode re-attach", async () => {
    const t = setup({
      platform: 'android',
      options: { androidKeyboardMode: 'stable' },
    });
    t.session.detach();
    t.session.attach();
    await flush();
    expect(t.native!.setWindowOverlayMode.mock.calls).toEqual([[true]]);

    t.session.detach();
    expect(t.native!.setWindowOverlayMode).toHaveBeenLastCalledWith(false);
  });

  it("applies 'stable' mode on the next open when the window lacked focus", async () => {
    const native = createFakeNativeModule();
    native.setWindowOverlayMode.mockResolvedValueOnce(false);
    const t = setup({
      platform: 'android',
      native,
      systemKeyboard: 280,
      options: { androidKeyboardMode: 'stable' },
    });
    await flush();
    expect(t.snapshot().windowOverlaysKeyboard).toBe(false);

    await openFully(t);
    expect(native.setWindowOverlayMode.mock.calls).toEqual([[true], [true]]);
    expect(t.snapshot().windowOverlaysKeyboard).toBe(true);
    t.session.detach();
    expect(native.setWindowOverlayMode).toHaveBeenLastCalledWith(false);
  });

  it('reattaches after a StrictMode detach', async () => {
    const t = setup();
    t.session.detach();
    t.session.attach();
    expect(t.controller.persistent.get(PRESS_LISTENER_SCRIPT_KEY)).toBe(
      pressListenerScript(true)
    );
    await openFully(t);
    expect(t.view().phase).toBe('open');
  });

  it('pads the body by the edge-to-edge navigation bar inset', async () => {
    const t = setup({
      platform: 'android',
      native: createFakeNativeModule({ navigationBarInset: 24 }),
    });
    await flush();
    expect(t.view().navigationBarInset).toBe(24);
    expect(t.snapshot().windowOverlaysKeyboard).toBe(true);
  });

  it('reads the navigation bar inset again on every open', async () => {
    const native = createFakeNativeModule({ navigationBarInset: 24 });
    const t = setup({ platform: 'android', native, systemKeyboard: 280 });
    await flush();
    // Rotated to landscape: the navigation bar moved to the side.
    native.getNavigationBarInset.mockResolvedValue(0);
    await openFully(t);
    await flush();

    expect(t.view()).toMatchObject({ navigationBarInset: 0, slotHeight: 280 });
    expect(t.snapshot().windowOverlaysKeyboard).toBe(false);
  });

  it('covers the navigation bar like the system keyboard does', async () => {
    // RN reports an edge-to-edge IME's height without the navigation bar
    // it also covers.
    const t = setup({
      platform: 'android',
      native: createFakeNativeModule({ navigationBarInset: 24 }),
      systemKeyboard: 280,
    });
    await flush();
    await openFully(t);
    await flush();

    expect(t.view()).toMatchObject({ keyboardHeight: 280, slotHeight: 304 });
    expect(t.snapshot().keyboardHeight).toBe(280);
  });
});

describe('editors without a controller', () => {
  it('injects through the WebView ref and still opens', async () => {
    const t = setup({ withController: false, native: null, systemKeyboard: 0 });
    const injectJavaScript = jest.fn();
    Object.assign(t.editor.webviewRef, { current: { injectJavaScript } });
    t.session.open('kb');
    await flush();
    expect(injectJavaScript).toHaveBeenCalledWith(INPUT_MODE_SUPPRESS_SCRIPT);
    expect(t.view().phase).toBe('open');
  });
});

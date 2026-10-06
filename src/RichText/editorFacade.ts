import type { RefObject } from 'react';
import { Platform } from 'react-native';
import type WebView from 'react-native-webview';
import cloneDeep from 'lodash/cloneDeep';
import { TenTapStartKit } from '../bridges/StarterKit';
import {
  createBridgeContext,
  createEditorController,
  type NativeEditorController,
} from '../native/EditorController';
import { attachEditorController } from '../shared/contracts';
import type { BridgeMessage } from '../shared/protocol';
import type { BridgeState, EditorBridge, EditorBridgeOptions } from '../types';
import { mergeThemes } from '../utils/mergeThemes';
import { uniqueBy } from '../utils/uniqueBy';
import { defaultEditorTheme } from './theme';
import { toRuntimePlatform } from './utils';

/**
 * The object behind `useEditorBridge`: one stable `EditorBridge` per hook,
 * backed by an `EditorController`. Option fields are getters over the latest
 * options passed to `setOptions`; commands and state go through the
 * controller.
 */
export interface EditorFacade {
  readonly editor: EditorBridge;
  readonly controller: NativeEditorController<BridgeState>;
  /** Called on every render with that render's options. */
  setOptions(options: EditorBridgeOptions | undefined): void;
}

type CoreState = Pick<
  BridgeState,
  'selection' | 'isFocused' | 'isReady' | 'editable' | 'empty'
>;

const resolveBridges = (options: EditorBridgeOptions) =>
  uniqueBy(options.bridgeExtensions ?? TenTapStartKit, 'name');

const bridgeNames = (options: EditorBridgeOptions) =>
  resolveBridges(options)
    .map((bridge) => bridge.name)
    .join('\n');

// The default theme is shared and read-only, so merge into a copy.
const resolveTheme = (theme: EditorBridgeOptions['theme']) =>
  mergeThemes(cloneDeep(defaultEditorTheme), theme);

/**
 * Before the first `stateUpdate`, so `getEditorState().selection.from` and
 * friends are readable as soon as the editor exists.
 */
const initialState = (editable: boolean): BridgeState => {
  const core: CoreState = {
    selection: { from: 0, to: 0 },
    isFocused: false,
    isReady: false,
    editable,
    empty: true,
  };
  // Bridge-specific keys are absent until the WebView reports them, as in 1.0.
  return core as BridgeState;
};

export function createEditorFacade(
  initialOptions: EditorBridgeOptions = {}
): EditorFacade {
  let options = initialOptions;
  let themeSource = options.theme;
  let theme = resolveTheme(themeSource);
  let warnedBridgeChange = false;

  const platform = toRuntimePlatform(Platform.OS);
  const bridgeExtensions = resolveBridges(options);
  const initialBridgeNames = bridgeNames(options);

  // Populated below; every `EditorBridge` member is defined before it is returned.
  const editor = {} as EditorBridge;
  const controller = createEditorController<BridgeState>({
    platform,
    initialState: initialState(options.editable ?? true),
    rpcTimeoutMs: options.rpcTimeoutMs,
    onReady: () => {
      // `focus` comes from CoreBridge, which a custom bridge list may omit.
      if (options.autofocus) editor.focus?.('end');
    },
  });
  attachEditorController(editor, controller);

  // React assigns `current` when `RichText` mounts the WebView, which hands
  // the instance to the controller; reads return whatever the controller has.
  const getWebView = () => controller.getWebView() as WebView | null;
  const webviewRef = {
    get current() {
      return getWebView();
    },
    set current(next: WebView | null) {
      controller.setWebView(next);
    },
  } as RefObject<WebView>;

  const editorStateRef: RefObject<BridgeState> = {
    get current() {
      return controller.getState();
    },
  };
  const sendBridgeMessage = (message: BridgeMessage) =>
    controller.send(message);
  const updateEditorState = (state: BridgeState) => controller.setState(state);
  const context = createBridgeContext(controller);

  bridgeExtensions.forEach((bridge) => {
    const instance: unknown = bridge.extendEditorInstance?.(
      sendBridgeMessage,
      webviewRef,
      editorStateRef,
      updateEditorState,
      Platform.OS,
      context
    );
    if (instance) Object.assign(editor, instance);
  });

  const base = {
    bridgeExtensions,
    webviewRef,
    get initialContent() {
      return options.initialContent;
    },
    get autofocus() {
      return options.autofocus === true;
    },
    get avoidIosKeyboard() {
      return options.avoidIosKeyboard ?? options.avoidKeyboard;
    },
    get avoidKeyboard() {
      return options.avoidIosKeyboard ?? options.avoidKeyboard;
    },
    get scrollBottomOffset() {
      return options.scrollBottomOffset;
    },
    get parseOptions() {
      return options.parseOptions;
    },
    get mergeStyles() {
      return options.mergeStyles;
    },
    get customSource() {
      return options.customSource;
    },
    get webviewBaseURL() {
      return options.webviewBaseURL;
    },
    get dynamicHeight() {
      return options.dynamicHeight;
    },
    // Android selection highlight is off unless asked for (#184).
    get disableColorHighlight() {
      return options.disableColorHighlight ?? platform === 'android';
    },
    get DEV() {
      return options.DEV;
    },
    get DEV_SERVER_URL() {
      return options.DEV_SERVER_URL;
    },
    get theme() {
      return theme;
    },
    // The editor's own state once known, as 1.0 copied it over the option.
    get editable() {
      const { editable } = controller.getState();
      return typeof editable === 'boolean' ? editable : options.editable;
    },
    /** @deprecated 1.0 copied `webviewRef.current` here; use `webviewRef`. */
    get current() {
      return getWebView();
    },
    getEditorState: () => controller.getState(),
    injectCSS: (css: string, tag?: string) => controller.injectCSS(css, tag),
    _updateEditorState: updateEditorState,
    _subscribeToEditorStateUpdate: (listener: (state: BridgeState) => void) =>
      controller.subscribeState(listener),
    _onContentUpdate: () => {
      controller.emitContentUpdate();
      options.onChange?.();
    },
    _subscribeToContentUpdate: (listener: () => void) =>
      controller.subscribeContent(listener),
  };

  // 1.0 returned plain data properties, so assigning one (`editor.theme =
  // …`) replaces the live getter with the assigned value instead of throwing.
  const assignable = (
    key: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor =>
    descriptor.get && !descriptor.set
      ? {
          ...descriptor,
          set: (value: unknown) =>
            Object.defineProperty(editor, key, {
              value,
              writable: true,
              enumerable: true,
              configurable: true,
            }),
        }
      : descriptor;

  // As in 1.0, a member returned by a bridge wins over the facade's own.
  (Object.keys(base) as (keyof typeof base)[]).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(editor, key)) return;
    Object.defineProperty(
      editor,
      key,
      assignable(key, Object.getOwnPropertyDescriptor(base, key)!)
    );
  });

  // 1.0 also copied every state field onto the editor; keep them readable as
  // live getters.
  const readState = (key: string): unknown => {
    const state: object = controller.getState();
    return (state as Record<string, unknown>)[key];
  };
  const exposeStateKeys = (state: BridgeState) => {
    Object.keys(state).forEach((key) => {
      if (key in editor) return;
      Object.defineProperty(
        editor,
        key,
        assignable(key, {
          get: () => readState(key),
          enumerable: true,
          configurable: true,
        })
      );
    });
  };
  exposeStateKeys(controller.getState());
  controller.subscribeState(exposeStateKeys);

  return {
    editor,
    controller,
    setOptions(next = {}) {
      options = next;
      if (next.theme !== themeSource) {
        themeSource = next.theme;
        theme = resolveTheme(next.theme);
      }
      if (
        __DEV__ &&
        !warnedBridgeChange &&
        bridgeNames(next) !== initialBridgeNames
      ) {
        warnedBridgeChange = true;
        console.warn(
          '[TenTap] bridgeExtensions changed after the editor was created. ' +
            'Bridges are read once; remount the editor to change them.'
        );
      }
    },
  };
}

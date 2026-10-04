import type { CoreEditorActionType } from '../../bridges/core';
import {
  getEditorController,
  type EditorController,
  type Listener,
  type Unsubscribe,
} from '../../shared/contracts';
import { PROTOCOL_TYPES } from '../../shared/protocol';
import type { EditorBridge } from '../../types';

/** What the custom keyboard needs from its editor. */
export interface EditorChannel {
  isFocused(): boolean;
  /** Focus and blur issued by the keyboard; never reported to `onExternalFocus`. */
  focus(): void;
  blur(): void;
  /** Runs `js` in the WebView, queued until the editor is ready. */
  injectScript(js: string): void;
  /** Keyed script re-applied after every reload; `null` removes it. */
  setPersistentScript(key: string, js: string | null): void;
  onFocusChange(listener: Listener<boolean>): Unsubscribe;
  /** A tap in the editor (needs the press listener script). */
  onEditorPress(listener: () => void): Unsubscribe;
  /** `editor.focus()` called by the app. */
  onExternalFocus(listener: () => void): Unsubscribe;
  /** The editor became ready again after its WebView reloaded. */
  onReload(listener: () => void): Unsubscribe;
}

const FOCUS_COMMAND: `${CoreEditorActionType.Focus}` = 'focus';

const noop = () => {};

const subscribeFocus = (
  editor: EditorBridge,
  listener: Listener<boolean>
): Unsubscribe => {
  let focused = editor.getEditorState().isFocused === true;
  return editor._subscribeToEditorStateUpdate((state) => {
    const next = state.isFocused === true;
    if (next === focused) return;
    focused = next;
    listener(next);
  });
};

const controllerChannel = (
  editor: EditorBridge,
  controller: EditorController<object>
): EditorChannel => {
  const token = Symbol('tentap.customKeyboard');
  return {
    isFocused: () => editor.getEditorState().isFocused === true,
    focus: () => controller.runInternal(token, () => editor.focus()),
    blur: () => controller.runInternal(token, () => editor.blur()),
    injectScript: (js) => controller.injectJS(js),
    setPersistentScript: (key, js) =>
      controller.registerPersistentScript(key, js),
    onFocusChange: (listener) => subscribeFocus(editor, listener),
    onEditorPress: (listener) =>
      controller.subscribeMessage(PROTOCOL_TYPES.EditorPress, () => listener()),
    onExternalFocus: (listener) =>
      controller.onCommand((message, meta) => {
        if (message.type === FOCUS_COMMAND && meta.internal !== token) {
          listener();
        }
      }),
    onReload(listener) {
      let ready = controller.isReady();
      let loadedBefore = ready;
      return controller.subscribeReady((next) => {
        if (next && !ready && loadedBefore) listener();
        if (next) loadedBefore = true;
        ready = next;
      });
    },
  };
};

/**
 * Editors without a controller (test doubles, hand-built bridges) only get the
 * WebView: scripts are injected once and taps, app focus calls and reloads
 * are not observed.
 */
const webViewChannel = (editor: EditorBridge): EditorChannel => {
  const inject = (js: string) =>
    editor.webviewRef.current?.injectJavaScript(js);
  return {
    isFocused: () => editor.getEditorState().isFocused === true,
    focus: () => editor.focus(),
    blur: () => editor.blur(),
    injectScript: inject,
    setPersistentScript: (_key, js) => {
      if (js !== null) inject(js);
    },
    onFocusChange: (listener) => subscribeFocus(editor, listener),
    onEditorPress: () => noop,
    onExternalFocus: () => noop,
    onReload: () => noop,
  };
};

export const createEditorChannel = (editor: EditorBridge): EditorChannel => {
  const controller = getEditorController(editor);
  return controller
    ? controllerChannel(editor, controller)
    : webViewChannel(editor);
};

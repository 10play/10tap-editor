import type { Editor } from '@tiptap/core';
import { Placeholder, type PlaceholderOptions } from '@tiptap/extensions';
import BridgeExtension from './base';
import { resolveBridgeContext } from './context';

type PlaceholderEditorState = {};

type PlaceholderEditorInstance = {
  setPlaceholder: (newPlaceholder: string) => void;
};

declare module '../types/EditorBridge' {
  interface BridgeState extends PlaceholderEditorState {}
  interface EditorBridge extends PlaceholderEditorInstance {}
}

export enum PlaceholderEditorActionType {
  setPlaceholder = 'set-placeholder',
}

export interface PlaceholderMessage {
  type: PlaceholderEditorActionType.setPlaceholder;
  payload: string;
}

/**
 * The options object the placeholder plugin reads when it builds its
 * decorations. Tiptap 3 hands out copies through `extension.options`, so
 * this is the only object whose change the plugin sees.
 */
const pluginOptions = new WeakMap<Editor, PlaceholderOptions>();

const TenTapPlaceholder = Placeholder.extend({
  addProseMirrorPlugins() {
    pluginOptions.set(this.editor, this.options);
    return this.parent?.() ?? [];
  },
});

export const PlaceholderBridge = new BridgeExtension<
  PlaceholderEditorState,
  PlaceholderEditorInstance,
  PlaceholderMessage
>({
  tiptapExtension: TenTapPlaceholder,
  extendCSS: `
    .is-editor-empty:first-child::before {
        color: #adb5bd;
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
    }
  `,
  onBridgeMessage: (editor, message) => {
    if (message.type !== PlaceholderEditorActionType.setPlaceholder) {
      return false;
    }
    const options = pluginOptions.get(editor);
    if (!options) return false;

    // Decorations are rebuilt on every transaction, so an empty one redraws.
    options.placeholder = message.payload;
    editor.view.dispatch(editor.state.tr.setMeta('addToHistory', false));
    return true;
  },
  extendEditorInstance: (
    sendBridgeMessage,
    webviewRef,
    editorState,
    setEditorState,
    platform,
    bridgeContext
  ) => {
    const context = resolveBridgeContext(
      sendBridgeMessage,
      webviewRef,
      editorState,
      setEditorState,
      platform,
      bridgeContext
    );
    return {
      setPlaceholder: (newPlaceholder) =>
        context.send(
          {
            type: PlaceholderEditorActionType.setPlaceholder,
            payload: newPlaceholder,
          },
          { coalesceKey: PlaceholderEditorActionType.setPlaceholder }
        ),
    };
  },
});

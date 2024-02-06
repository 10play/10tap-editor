import { Editor, type AnyExtension } from '@tiptap/core';
import type { EditorInstance, EditorNativeState } from '../types';
import type WebView from 'react-native-webview';
import type { RefObject } from 'react';

interface TenTapBridge<T = any, E = any, M = any> {
  name: string;
  tiptapExtension?: AnyExtension;
  tiptapExtensionDeps?: AnyExtension[];
  onBridgeMessage?: (
    editor: Editor,
    message: M,
    sendMessageBack: (message: M) => void
  ) => boolean;
  onEditorMessage?: (message: M, editorInstance: EditorInstance) => boolean;
  extendEditorState?: (editor: Editor) => T;
  extendEditorInstance?: (
    sendBridgeMessage: (message: M) => void,
    webviewRef?: RefObject<WebView>,
    editorState?: RefObject<EditorNativeState | {}>,
    _setEditorState?: (editorState: EditorNativeState) => void
  ) => E;
  extendCSS?: string | undefined;
  config?: string;
}

type CreateTenTapBridgeArgs<T = any, E = any, M = any> = Omit<
  TenTapBridge<T, E, M> & { forceName?: string },
  | 'name'
  | 'sendMessage'
  | 'configureExtension'
  | 'configureTiptapExtensionsOnRunTime'
  | 'configureCSS'
>;

class TenTapBridge<T = any, E = any, M = any> {
  constructor({
    forceName,
    tiptapExtension,
    tiptapExtensionDeps,
    onBridgeMessage,
    onEditorMessage,
    extendEditorState,
    extendEditorInstance,
    extendCSS,
  }: CreateTenTapBridgeArgs<T, E, M>) {
    if (!tiptapExtension) {
      this.name = forceName || 'TenTapBridge';
    } else {
      this.name = Array.isArray(tiptapExtension)
        ? tiptapExtension.map((e) => e.name).join('+')
        : tiptapExtension.name;
    }

    this.tiptapExtension = tiptapExtension;
    this.tiptapExtensionDeps = tiptapExtensionDeps;
    this.onBridgeMessage = onBridgeMessage;
    this.onEditorMessage = onEditorMessage;
    this.extendEditorState = extendEditorState;
    this.extendEditorInstance = extendEditorInstance;
    this.extendCSS = extendCSS;
  }

  configureExtension(config: any) {
    this.config = config;
    return this;
  }
  configureCSS(css: string) {
    this.extendCSS = css;
    return this;
  }
  configureTiptapExtensionsOnRunTime(config: any) {
    this.tiptapExtension = this.tiptapExtension?.configure(config);
    return [this.tiptapExtension, ...(this.tiptapExtensionDeps || [])];
  }
}
export default TenTapBridge;

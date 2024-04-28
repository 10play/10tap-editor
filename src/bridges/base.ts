import { Editor, type AnyExtension } from '@tiptap/core';
import type { EditorBridge, BridgeState } from '../types';
import type WebView from 'react-native-webview';
import type { RefObject } from 'react';

interface BridgeExtension<T = any, E = any, M = any, C = any> {
  name: string;
  tiptapExtension?: AnyExtension;
  tiptapExtensionDeps?: AnyExtension[];
  onBridgeMessage?: (
    editor: Editor,
    message: M,
    sendMessageBack: (message: M) => void
  ) => boolean;
  onEditorMessage?: (message: M, editorBridge: EditorBridge) => boolean;
  extendEditorState?: (editor: Editor) => T;
  extendEditorInstance?: (
    sendBridgeMessage: (message: M) => void,
    webviewRef?: RefObject<WebView>,
    editorState?: RefObject<BridgeState | {}>,
    _setEditorState?: (editorState: BridgeState) => void
  ) => E;
  extendCSS?: string | undefined;
  config?: C;
  extendConfig?: any;
}

type CreateTenTapBridgeArgs<T = any, E = any, M = any, C = any> = Omit<
  BridgeExtension<T, E, M, C> & { forceName?: string },
  | 'name'
  | 'sendMessage'
  | 'configureExtension'
  | 'configureTiptapExtensionsOnRunTime'
  | 'configureCSS'
  | 'extendExtension'
  | 'clone'
>;

class BridgeExtension<T = any, E = any, M = any, C = any> {
  constructor({
    forceName,
    tiptapExtension,
    tiptapExtensionDeps,
    onBridgeMessage,
    onEditorMessage,
    extendEditorState,
    extendEditorInstance,
    extendCSS,
    config,
    extendConfig,
  }: CreateTenTapBridgeArgs<T, E, M, C>) {
    if (!tiptapExtension) {
      this.name = forceName || 'BridgeExtension';
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
    this.config = config;
    this.extendConfig = extendConfig;
  }

  // we can use clone, so that extension's can be configures without modifying
  // the values for each extension
  clone(): BridgeExtension<T, E, M> {
    return new BridgeExtension<T, E, M>({
      ...this,
      forceName: this.name,
    });
  }

  // runs on native
  configureExtension(config: C) {
    const cloned = this.clone();
    cloned.config = config;
    return cloned;
  }

  configureCSS(css: string) {
    const cloned = this.clone();
    cloned.extendCSS = css;
    return cloned;
  }

  extendExtension(config: any) {
    const cloned = this.clone();
    cloned.extendConfig = config;
    return cloned;
  }

  // runs on web
  configureTiptapExtensionsOnRunTime(config: any, extendConfig: any) {
    // Configure extension
    if (this.tiptapExtension) {
      if (config) {
        this.tiptapExtension = this.tiptapExtension?.configure(config);
      }
      if (extendConfig) {
        this.tiptapExtension = this.tiptapExtension?.extend(extendConfig);
      }
    }
    return [this.tiptapExtension, ...(this.tiptapExtensionDeps || [])];
  }
}
export default BridgeExtension;

import type { AnyExtension, Editor } from '@tiptap/core';
import type { RefObject } from 'react';
import type WebView from 'react-native-webview';
import type { BridgeContext } from '../shared/contracts';
import type { EditorBridge, BridgeState } from '../types';

interface BridgeExtension<T = any, E = any, M = any> {
  name: string;
  tiptapExtension?: AnyExtension;
  tiptapExtensionDeps?: AnyExtension[];
  /** Runs in the WebView for every command sent by native. */
  onBridgeMessage?: (
    editor: Editor,
    message: M,
    sendMessageBack: (message: M) => void
  ) => boolean;
  /** Runs on native for every message posted by the WebView. */
  onEditorMessage?: (message: M, editorBridge: EditorBridge) => boolean;
  /** Runs in the WebView; the results of every bridge are merged into `BridgeState`. */
  extendEditorState?: (editor: Editor) => T;
  /**
   * Runs on native; the returned members are merged into the `EditorBridge`.
   * `context` is passed by 1.1 hosts and gives access to RPCs, coalesced
   * sends and capability checks. Bridges written against the five-argument
   * form keep working unchanged.
   */
  extendEditorInstance?: (
    sendBridgeMessage: (message: M) => void,
    webviewRef?: RefObject<WebView>,
    editorState?: RefObject<BridgeState | {}>,
    _setEditorState?: (editorState: BridgeState) => void,
    platform?: string,
    context?: BridgeContext<BridgeState>
  ) => E;
  extendCSS?: string | undefined;
  config?: any;
  extendConfig?: any;
}

type CreateTenTapBridgeArgs<T = any, E = any, M = any> = Omit<
  BridgeExtension<T, E, M> & { forceName?: string },
  | 'name'
  | 'sendMessage'
  | 'configureExtension'
  | 'configureTiptapExtensionsOnRunTime'
  | 'configureCSS'
  | 'extendExtension'
  | 'clone'
>;

const isDefined = <V>(value: V | null | undefined): value is V =>
  value !== null && value !== undefined;

class BridgeExtension<T = any, E = any, M = any> {
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
  }: CreateTenTapBridgeArgs<T, E, M>) {
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

  /** Returns a copy, so a configured bridge never changes the shared instance. */
  clone(): BridgeExtension<T, E, M> {
    return new BridgeExtension<T, E, M>({
      ...this,
      forceName: this.name,
    });
  }

  /** Native: options passed to the tiptap extension's `configure` in the WebView. */
  configureExtension(config: any) {
    const cloned = this.clone();
    cloned.config = config;
    return cloned;
  }

  configureCSS(css: string) {
    const cloned = this.clone();
    cloned.extendCSS = css;
    return cloned;
  }

  /** Native: config passed to the tiptap extension's `extend` in the WebView. */
  extendExtension(config: any) {
    const cloned = this.clone();
    cloned.extendConfig = config;
    return cloned;
  }

  /**
   * Web: the tiptap extensions this bridge contributes, with the native
   * `config`/`extendConfig` applied. Pure: the bridge itself is never
   * modified, so calling it on every render does not stack configurations
   * (#309). CSS-only bridges contribute nothing.
   */
  configureTiptapExtensionsOnRunTime(
    config?: unknown,
    extendConfig?: unknown
  ): AnyExtension[] {
    let extension = this.tiptapExtension;
    if (extension && config) {
      extension = extension.configure(config);
    }
    if (extension && extendConfig) {
      extension = extension.extend(extendConfig);
    }
    return [extension, ...(this.tiptapExtensionDeps ?? [])].filter(isDefined);
  }
}
export default BridgeExtension;

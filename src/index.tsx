import { editorHtml as builtEditorHtml } from './simpleWebEditor/build/editorHtml';

export * from './RichText';
export { default as BridgeExtension } from './bridges/base';
export * from './bridges/StarterKit';
export * from './bridges/bold';
export * from './bridges/italic';
export * from './bridges/strike';
export * from './bridges/history';
export * from './bridges/orderedList';
export * from './bridges/heading';
export * from './bridges/br';
export * from './bridges/bulletList';
export * from './bridges/blockquote';
export * from './bridges/listItem';
export * from './bridges/code';
export * from './bridges/dropcursor';
export * from './bridges/underline';
export * from './bridges/tasklist';
export * from './bridges/link';
export * from './bridges/color';
export * from './bridges/highlight';
export * from './bridges/placeholder';
export * from './bridges/core';
export * from './bridges/image';
export * from './types';
export * from './utils';
export { Images } from './assets';
export { EditorHelper, useRemoteEditorBridge } from './RichText/EditorHelper';
export {
  defaultColorKeyboardTheme,
  darkColorKeyboardTheme,
} from './RichText/Keyboard/keyboardTheme';
export { TentapRpcTimeoutError, TentapUnsupportedError } from './shared/errors';
export type {
  BridgeContext,
  RpcOptions,
  SendOptions,
} from './shared/contracts';
export type { Capabilities, CapabilityName } from './shared/capabilities';
// Re-declared here because tsc does not emit the generated module's
// declaration file, which the published types could not resolve.
/** The HTML of the built-in editor page. */
export const editorHtml: string = builtEditorHtml;

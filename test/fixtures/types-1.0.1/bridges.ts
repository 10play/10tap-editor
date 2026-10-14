// 1.0.1 bridge APIs: configuring built-in bridges, writing a custom bridge
// and augmenting BridgeState / EditorBridge (docs: "Create a bridge").
import type { RefObject } from 'react';
import type WebView from 'react-native-webview';
import { Extension, type Editor } from '@tiptap/core';
import {
  BlockquoteBridge,
  BoldBridge,
  BridgeExtension,
  BulletListBridge,
  CodeBridge,
  ColorBridge,
  CoreBridge,
  CoreEditorActionType,
  DropCursorBridge,
  EditorActionType,
  EditorMessageType,
  EditorUpdateSettings,
  HardBreakBridge,
  HeadingBridge,
  HighlightBridge,
  HistoryBridge,
  ImageBridge,
  ItalicBridge,
  LinkBridge,
  ListItemBridge,
  ListItemEditorActionType,
  OrderedListBridge,
  PlaceholderBridge,
  PlaceholderEditorActionType,
  StrikeBridge,
  TaskListBridge,
  TenTapStartKit,
  UnderlineBridge,
  type BridgeState,
  type CoreMessages,
  type EditorActionMessage,
  type EditorBridge,
  type EditorMessage,
  type ListItemMessage,
  type PlaceholderMessage,
  type RegularAction,
} from '@10play/tentap-editor';

type CounterState = { wordCount: number };
type CounterInstance = { resetCounter: () => void };
type CounterMessage = { type: 'reset-counter'; payload?: undefined };

declare module '@10play/tentap-editor' {
  interface BridgeState extends CounterState {}
  interface EditorBridge extends CounterInstance {}
}

const Counter = Extension.create({ name: 'counter' });

export const CounterBridge = new BridgeExtension<
  CounterState,
  CounterInstance,
  CounterMessage
>({
  forceName: 'counter',
  tiptapExtension: Counter,
  tiptapExtensionDeps: [],
  onBridgeMessage: (editor: Editor, message, sendMessageBack) => {
    if (message.type === 'reset-counter') {
      editor.commands.clearContent();
      sendMessageBack(message);
      return true;
    }
    return false;
  },
  onEditorMessage: (message, editorBridge: EditorBridge) => {
    editorBridge.focus();
    return message.type === 'reset-counter';
  },
  extendEditorState: (editor) => ({
    wordCount: editor.getText().split(' ').length,
  }),
  extendEditorInstance: (
    sendBridgeMessage,
    webviewRef?: RefObject<WebView>,
    editorState?: RefObject<BridgeState | {}>,
    setEditorState?: (state: BridgeState) => void,
    platform?: string
  ) => ({
    resetCounter: () => {
      webviewRef?.current?.requestFocus();
      if (editorState?.current && setEditorState && platform) {
        setEditorState(editorState.current as BridgeState);
      }
      sendBridgeMessage({ type: 'reset-counter' });
    },
  }),
  extendCSS: '.counter { color: red; }',
  config: { limit: 10 },
  extendConfig: { addKeyboardShortcuts: undefined },
});

// A bridge that overrides the web-side configuration the 1.0.1 way, as
// 10tap-pro-collaboration does: typed config, and the inferred
// `(AnyExtension | undefined)[]` return of 1.0.1's own implementation.
type SyncConfig = { url?: string; name: string };

export class SyncBridge extends BridgeExtension<CounterState> {
  private done = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 1.0.1 code
  configureTiptapExtensionsOnRunTime(config: SyncConfig, extendConfig: any) {
    if (this.done) return [];
    this.done = true;
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

export const syncBridge: BridgeExtension = new SyncBridge({
  tiptapExtension: Counter,
});

export const augmented = (editor: EditorBridge, state: BridgeState) => {
  editor.resetCounter();
  const words: number = state.wordCount;
  return words;
};

export const configuredBridges: BridgeExtension[] = [
  CounterBridge.configureExtension({ limit: 20 }),
  CounterBridge.extendExtension({ addCommands: () => ({}) }),
  CounterBridge.configureCSS('.counter { color: blue; }'),
  CounterBridge.clone(),
  CoreBridge.configureCSS('* { font-family: serif; }'),
  PlaceholderBridge.configureExtension({ placeholder: 'Type something...' }),
  LinkBridge.configureExtension({ openOnClick: true, autolink: false }),
  ImageBridge.configureExtension({ inline: true, allowBase64: true }),
  HighlightBridge.configureExtension({ multicolor: false }),
  TaskListBridge.configureExtension({ nested: false }),
  HeadingBridge.configureExtension({ levels: [1, 2, 3] }),
  HistoryBridge.configureExtension({ depth: 10 }),
  BoldBridge.extendExtension({ addKeyboardShortcuts: () => ({}) }),
  BlockquoteBridge.configureCSS('blockquote { margin: 0; }'),
  CodeBridge.configureCSS('code { color: red; }'),
];

export const everyBuiltInBridge: BridgeExtension[] = [
  ...TenTapStartKit,
  BlockquoteBridge,
  BoldBridge,
  BulletListBridge,
  CodeBridge,
  ColorBridge,
  CoreBridge,
  DropCursorBridge,
  HardBreakBridge,
  HeadingBridge,
  HighlightBridge,
  HistoryBridge,
  ImageBridge,
  ItalicBridge,
  LinkBridge,
  ListItemBridge,
  OrderedListBridge,
  PlaceholderBridge,
  StrikeBridge,
  TaskListBridge,
  UnderlineBridge,
];

export const bridgeFields = (bridge: BridgeExtension) => {
  const name: string = bridge.name;
  const css: string | undefined = bridge.extendCSS;
  const extensions = bridge.configureTiptapExtensionsOnRunTime(
    bridge.config,
    bridge.extendConfig
  );
  return { name, css, extensions, deps: bridge.tiptapExtensionDeps };
};

export const messages = () => {
  const action: EditorActionMessage = {
    type: EditorMessageType.Action,
    payload: { type: CoreEditorActionType.Focus, payload: 'end' },
    id: 'abc',
  };
  const core: EditorMessage & CoreMessages = {
    type: CoreEditorActionType.GetHTML,
    payload: { messageId: '1' },
  };
  const listItem: ListItemMessage = { type: ListItemEditorActionType.Lift };
  const placeholder: PlaceholderMessage = {
    type: PlaceholderEditorActionType.setPlaceholder,
    payload: 'Write',
  };
  const regular: RegularAction = { type: EditorActionType.ChangeColor };
  const settings: string = EditorUpdateSettings.Focus;
  return { action, core, listItem, placeholder, regular, settings };
};

// Other 1.0.1 `@10play/tentap-editor/web` usage in custom bundles: the
// prosemirror re-exports (aliased by the documented Vite config), custom
// web-side bridges, sendMessage and the injected window globals.
import React from 'react';
import { EditorContent } from '@tiptap/react';
import {
  BridgeExtension,
  CoreBridge,
  Decoration,
  DecorationSet,
  EditorState,
  EditorView,
  HistoryBridge,
  Plugin,
  PluginKey,
  TextSelection,
  TenTapStartKit,
  blueBackgroundPlugin,
  sendMessage,
  useTenTap,
} from '@10play/tentap-editor';
import { Extension } from '@tiptap/core';
import { expectAssignable } from '../typeAssert';

const markerKey = new PluginKey('marker');

const Marker = Extension.create({
  name: 'marker',
  addProseMirrorPlugins: () => [
    new Plugin({
      key: markerKey,
      props: {
        decorations: (state: EditorState) =>
          DecorationSet.create(state.doc, [
            Decoration.inline(0, 1, { class: 'marker' }),
          ]),
      },
    }),
  ],
});

type MarkerMessage = { type: 'marker-ping'; payload: number };

export const MarkerBridge = new BridgeExtension<
  { markerActive: boolean },
  { ping: () => void },
  MarkerMessage
>({
  tiptapExtension: Marker,
  onBridgeMessage: (editor, message, sendMessageBack) => {
    if (message.type !== 'marker-ping') return false;
    editor.commands.focus();
    sendMessageBack({ type: 'marker-ping', payload: message.payload + 1 });
    return true;
  },
  extendEditorState: (editor) => ({
    markerActive: editor.isActive('marker'),
  }),
});

export const CustomEditor = () => {
  const editor = useTenTap({
    bridges: [...TenTapStartKit, CoreBridge, HistoryBridge, MarkerBridge],
    tiptapOptions: {
      extensions: [blueBackgroundPlugin],
      editorProps: {
        handleScrollToSelection: (view: EditorView) =>
          view.state.selection instanceof TextSelection,
      },
    },
  });
  const minimal = useTenTap();
  return (
    <>
      <EditorContent editor={editor} />
      <EditorContent editor={minimal} />
    </>
  );
};

export const injectedGlobals = () => ({
  initialContent: expectAssignable<string>(window.initialContent),
  config: expectAssignable<string>(window.bridgeExtensionConfigMap),
  whitelist: expectAssignable<string[]>(window.whiteListBridgeExtensions),
  dynamicHeight: expectAssignable<boolean | undefined>(window.dynamicHeight),
  disableColorHighlight: expectAssignable<boolean | undefined>(
    window.disableColorHighlight
  ),
  platform: expectAssignable<'ios' | 'android' | 'web' | undefined>(
    window.platform
  ),
  post: window.ReactNativeWebView.postMessage('{}'),
  sendMessage: expectAssignable<(message: never) => void>(sendMessage),
});

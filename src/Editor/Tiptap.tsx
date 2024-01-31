import debounce from 'lodash/debounce';
import React, { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Editor } from '@tiptap/core';
// import TextStyle from '@tiptap/extension-text-style';
// import { Color } from '@tiptap/extension-color';
// import Highlight from '@tiptap/extension-highlight';
import { EditorMessage, EditorMessageType } from '../types/Messaging';
import focusListener from './utils/focusListener';
import { TenTapStartKit } from './plugins/StarterKit';
import { UnderlineBridge } from './plugins/underline';
import { EditorState } from '../types/EditorState';
import { TaskListBridge } from './plugins/tasklist';
import { LinkBridge } from './plugins/link';
import { ColorBridge } from './plugins/color';
import { HighlightBridge } from './plugins/highlight';
// import { blueBackgroundPlugin } from './plugins/HighlightSelection';

const tenTapExtensions = [
  // blueBackgroundPlugin,
  TenTapStartKit,
  UnderlineBridge,
  TaskListBridge,
  LinkBridge,
  ColorBridge,
  HighlightBridge,
  // TextStyle,
  // Color,
  // Highlight.configure({ multicolor: true }),
].filter(
  (e) => !window.whiteListPlugins || window.whiteListPlugins.includes(e.name)
);

const extensions = tenTapExtensions.map((e) => e.tiptapExtension).flat();

const content = '<p>Hello <u>World!</u></p>';

const sendMessage = (message: EditorMessage) => {
  // @ts-ignore TODO fix type
  window.ReactNativeWebView?.postMessage(JSON.stringify(message));
};

const sendStateUpdate = debounce((editor: Editor) => {
  let payload = {
    // core
    isFocused: focusListener.isFocused,
  };

  const state = tenTapExtensions.reduce((acc, e) => {
    return Object.assign(acc, e.extendEditorState(editor));
  }, payload) as EditorState;

  sendMessage({
    type: EditorMessageType.StateUpdate,
    payload: state,
  });
}, 10);

export default function Tiptap() {
  const editor = useEditor({
    extensions,
    content,
    onUpdate: (onUpdate) => sendStateUpdate(onUpdate.editor),
    onSelectionUpdate: (onUpdate) => sendStateUpdate(onUpdate.editor),
    onTransaction: (onUpdate) => sendStateUpdate(onUpdate.editor),
  });

  useEffect(() => {
    if (!editor) return;
    // Subscribe to editor message
    const handleEditorAction = (action: any) => {
      tenTapExtensions.forEach((e) => {
        e.onBridgeMessage(editor, action);
      });
      // const { type, payload } = action;
      // switch (type) {

      //   case EditorUpdateSettings.UpdateScrollThresholdAndMargin:
      //     editor.setOptions({
      //       editorProps: {
      //         scrollThreshold: { top: 0, bottom: payload, right: 0, left: 0 },
      //         scrollMargin: { top: 0, bottom: payload, right: 0, left: 0 },
      //       },
      //     });
      //     break;

      // }
    };
    const handleWebviewMessage = (event: MessageEvent | Event) => {
      if (!(event instanceof MessageEvent)) return; // TODO check android
      const { type, payload } = JSON.parse(event.data) as EditorMessage;
      console.log('Received message from webview', { type, payload });
      switch (type) {
        case EditorMessageType.Action:
          // Handle actions
          handleEditorAction(payload);
          break;
      }
    };
    // We need to listen to both window and document events because some platform get
    // webview messages from window and some from document
    window.addEventListener('message', handleWebviewMessage);
    document.addEventListener('message', handleWebviewMessage);

    return () => {
      window.removeEventListener('message', handleWebviewMessage);
      document.removeEventListener('message', handleWebviewMessage);
    };
  }, [editor]);

  return <EditorContent editor={editor} />;
}

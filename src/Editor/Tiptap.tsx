import debounce from 'lodash/debounce';
import React, { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Editor } from '@tiptap/core';
// import StarterKit from '@tiptap/starter-kit';
// import TaskList from '@tiptap/extension-task-list';
// import Link from '@tiptap/extension-link';
// import TextStyle from '@tiptap/extension-text-style';
// import { Color } from '@tiptap/extension-color';
// import TaskItem from '@tiptap/extension-task-item';
// import Highlight from '@tiptap/extension-highlight';
import { EditorMessage, EditorMessageType } from '../types/Messaging';
import focusListener from './utils/focusListener';
import { TenTapStartKit } from './plugins/StarterKit';
import { UnderlineBridge } from './plugins/underline';
import { EditorState } from '../types/EditorState';
// import { blueBackgroundPlugin } from './plugins/HighlightSelection';

const tenTapExtensions = [
  // blueBackgroundPlugin,
  TenTapStartKit,
  UnderlineBridge,
  // TaskList,
  // TaskItem,
  // Link.configure({
  //   openOnClick: false,
  //   autolink: true,
  // }),
  // TextStyle,
  // Color,
  // Highlight.configure({ multicolor: true }),
].filter(
  (e) => !window.whiteListPlugins || window.whiteListPlugins.includes(e.name)
);

const extensions = tenTapExtensions.map((e) => e.tiptapPlugin);

const content = '<p>Hello <u>World!</u></p>';

const sendMessage = (message: EditorMessage) => {
  // @ts-ignore TODO fix type
  window.ReactNativeWebView?.postMessage(JSON.stringify(message));
};

const sendStateUpdate = debounce((editor: Editor) => {
  let payload = {
    activeHighlight: editor.getAttributes('highlight').color,
    activeColor: editor.getAttributes('textStyle').color,
    activeLink: editor.getAttributes('link').href,
    canAddLink: !editor.state.selection.empty,
    // start

    // Underline

    // canToggleCheckList: false,
    isLinkActive: editor.isActive('link'),
    isCheckListActive: editor.isActive('taskList'),
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
        e.onTenTapMessage(editor, action);
      });
      // const { type, payload } = action;
      // switch (type) {
      //   case EditorActionType.ToggleCheckList:
      //     editor.chain().focus().toggleTaskList().run();
      //     break;
      //   case EditorActionType.Link:
      //     // cancelled
      //     if (payload === null) {
      //       return;
      //     }

      //     // empty
      //     if (payload === '') {
      //       editor
      //         .chain()
      //         .focus()
      //         .extendMarkRange('link')
      //         .unsetLink()
      //         .setTextSelection(editor.state.selection.from)
      //         .run();

      //       return;
      //     }

      //     // update link
      //     editor
      //       .chain()
      //       .focus()
      //       .extendMarkRange('link')
      //       .setLink({ href: payload })
      //       .setTextSelection(editor.state.selection.from)
      //       .run();
      //     break;
      //   case EditorUpdateSettings.UpdateScrollThresholdAndMargin:
      //     editor.setOptions({
      //       editorProps: {
      //         scrollThreshold: { top: 0, bottom: payload, right: 0, left: 0 },
      //         scrollMargin: { top: 0, bottom: payload, right: 0, left: 0 },
      //       },
      //     });
      //     break;
      //   case EditorActionType.ChangeHighlight:
      //     editor.chain().focus().toggleHighlight({ color: payload }).run();
      //     break;
      //   case EditorActionType.ChangeColor:
      //     editor.chain().focus().setColor(payload).run();
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

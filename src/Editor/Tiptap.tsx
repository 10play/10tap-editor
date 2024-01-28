import debounce from 'lodash/debounce';
import React, { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import Link from '@tiptap/extension-link';
import TaskItem from '@tiptap/extension-task-item';
import { EditorMessage, EditorMessageType } from '../types/Messaging';
import { EditorAction, EditorActionType } from '../types/Actions';
import { blueBackgroundPlugin } from './plugins/HighlightSelection';
import focusListener from './utils/focusListener';

const extensions = [
  StarterKit,
  Underline,
  TaskList,
  TaskItem,
  Link.configure({
    openOnClick: false,
    autolink: true,
  }),
  blueBackgroundPlugin,
];

const content = '<p>Hello World!</p>';

const sendMessage = (message: EditorMessage) => {
  // @ts-ignore TODO fix type
  window.ReactNativeWebView?.postMessage(JSON.stringify(message));
};

const sendStateUpdate = debounce((editor: Editor) => {
  sendMessage({
    type: EditorMessageType.StateUpdate,
    payload: {
      activeLink: editor.getAttributes('link').href,
      canAddLink: !editor.state.selection.empty,
      canToggleBold: editor.can().toggleBold(),
      canToggleItalic: editor.can().toggleItalic(),
      canToggleBulletList: editor.can().toggleBulletList(),
      canToggleUnderline: editor.can().toggleUnderline(),
      canToggleCheckList: editor.can().toggleTaskList(),
      canToggleHeading: editor.can().toggleHeading({ level: 1 }),
      canToggleOrderedList: editor.can().toggleOrderedList(),
      canToggleStrikethrough: editor.can().toggleStrike(),
      canLift: editor
        .can()
        .liftListItem(editor.state.schema.nodes.listItem.name),
      canSink: editor
        .can()
        .sinkListItem(editor.state.schema.nodes.listItem.name),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
      isFocused: focusListener.isFocused,
      isLinkActive: editor.isActive('link'),
      isBoldActive: editor.isActive('bold'),
      isItalicActive: editor.isActive('italic'),
      isUnderlineActive: editor.isActive('underline'),
      isStrikethroughActive: editor.isActive('strike'),
      isBulletListActive: editor.isActive('bulletList'),
      isCheckListActive: editor.isActive('taskList'),
      isOrderedListActive: editor.isActive('orderedList'),
      headingLevel: editor.getAttributes('heading')?.level,
    },
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
    const handleEditorAction = (action: EditorAction) => {
      const { type, payload } = action;
      switch (type) {
        case EditorActionType.Link:
          // cancelled
          if (payload === null) {
            return;
          }

          // empty
          if (payload === '') {
            editor
              .chain()
              .focus()
              .extendMarkRange('link')
              .unsetLink()
              .setTextSelection(editor.state.selection.from)
              .run();

            return;
          }

          // update link
          editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({ href: payload })
            .setTextSelection(editor.state.selection.from)
            .run();
          break;
        case EditorActionType.ToggleBold:
          editor.chain().focus().toggleBold().run();
          break;
        case EditorActionType.ToggleItalic:
          editor.chain().focus().toggleItalic().run();
          break;
        case EditorActionType.ToggleUnderline:
          editor.chain().focus().toggleUnderline().run();
          break;
        case EditorActionType.ToggleStrikethrough:
          editor.chain().focus().toggleStrike().run();
          break;
        case EditorActionType.ToggleBulletList:
          editor.chain().focus().toggleBulletList().run();
          break;
        case EditorActionType.ToggleOrderedList:
          editor.chain().focus().toggleOrderedList().run();
          break;
        case EditorActionType.ToggleCheckList:
          editor.chain().focus().toggleTaskList().run();
          break;
        case EditorActionType.ToggleHeading:
          editor.chain().focus().toggleHeading({ level: payload }).run();
          break;
        case EditorActionType.Lift:
          editor
            .chain()
            .focus()
            .liftListItem(editor.schema.nodes.listItem.name)
            .run();
          break;
        case EditorActionType.Sink:
          editor
            .chain()
            .focus()
            .sinkListItem(editor.schema.nodes.listItem.name)
            .run();
          break;
        case EditorActionType.Undo:
          editor.chain().focus().undo().run();
          break;
        case EditorActionType.Redo:
          editor.chain().focus().redo().run();
          break;
      }
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

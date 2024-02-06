import React from 'react';
import { EditorContent } from '@tiptap/react';
import { useTenTap } from 'tentap/web';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { CounterBridge } from '../CounterBridge';

export const AdvancedEditor = () => {
  const editor = useTenTap({
    bridges: [CounterBridge],
    tiptapOptions: {
      extensions: [Document, Paragraph, Text],
    },
  });
  return <EditorContent editor={editor} />;
};

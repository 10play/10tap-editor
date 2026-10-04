// docs/setup/advancedSetup.md, step 4.
import React from 'react';
import { EditorContent } from '@tiptap/react';
import { useTenTap, TenTapStartKit } from './tentap';
import { CounterBridge } from './CounterBridge';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';

/**
 * Here we control the web side of our custom editor
 */
export const AdvancedEditor = () => {
  const editor = useTenTap({
    bridges: [...TenTapStartKit, CounterBridge],
    tiptapOptions: {
      extensions: [Document, Paragraph, Text],
    },
  });
  return (
    <EditorContent
      editor={editor}
      className={window.dynamicHeight ? 'dynamic-height' : undefined}
    />
  );
};

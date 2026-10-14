import React from 'react';
import { EditorContent } from '@tiptap/react';
import { useTenTap, CoreBridge } from '@10play/tentap-editor';
import { CounterBridge } from '../CounterBridge';

export const AdvancedEditor = () => {
  const editor = useTenTap({
    bridges: [CoreBridge, CounterBridge],
  });
  return <EditorContent editor={editor} />;
};

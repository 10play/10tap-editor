import React from 'react';
import { EditorContent } from '@tiptap/react';
import { useTenTap } from 'tentap';

export const AdvancedEditor = () => {
  const editor = useTenTap();

  return <EditorContent editor={editor} />;
};

import React from 'react';
import { EditorContent } from '@tiptap/react';
import { useTenTap } from '../web/useTenTap';
import { boot } from '../web/runtime';
import { TenTapStartKit } from '../bridges/StarterKit';

export default function Tiptap() {
  const editor = useTenTap({ bridges: TenTapStartKit });
  const { dynamicHeight } = boot().requireConfig();

  return (
    <EditorContent
      editor={editor}
      className={dynamicHeight ? 'tentap-root dynamic-height' : 'tentap-root'}
    />
  );
}

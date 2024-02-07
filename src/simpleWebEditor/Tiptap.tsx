import React from 'react';
import { EditorContent } from '@tiptap/react';
import { useTenTap } from '../webEditorUtils';
import { TenTapStartKit } from '../bridges/StarterKit';

let tenTapExtensions = TenTapStartKit.filter(
  (e) =>
    !window.whiteListBridgeExtensions ||
    window.whiteListBridgeExtensions.includes(e.name)
);

export default function Tiptap() {
  const editor = useTenTap({ bridges: tenTapExtensions });

  return <EditorContent editor={editor} />;
}

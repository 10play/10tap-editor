import React from 'react';
import { EditorContent } from '@tiptap/react';
import { useTenTap } from '../webEditorUtils';
import { TenTapStartKit } from '../bridges/StarterKit';
import { UnderlineBridge } from '../bridges/underline';
import { TaskListBridge } from '../bridges/tasklist';
import { LinkBridge } from '../bridges/link';
import { ColorBridge } from '../bridges/color';
import { HighlightBridge } from '../bridges/highlight';
import { CoreBridge } from '../bridges/core';
import { ImageBridge } from '../bridges/image';
import { PlaceholderBridge } from '../bridges/placeholder';

let tenTapExtensions = [
  TenTapStartKit,
  UnderlineBridge,
  ImageBridge,
  TaskListBridge,
  LinkBridge,
  ColorBridge,
  HighlightBridge,
  CoreBridge,
  PlaceholderBridge,
].filter(
  (e) =>
    !window.whiteListBridgeExtensions ||
    window.whiteListBridgeExtensions.includes(e.name)
);

export default function Tiptap() {
  const editor = useTenTap({ bridges: tenTapExtensions });

  return <EditorContent editor={editor} />;
}

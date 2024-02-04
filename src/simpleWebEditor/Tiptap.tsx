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

let tenTapExtensions = [
  TenTapStartKit,
  UnderlineBridge,
  ImageBridge,
  TaskListBridge,
  LinkBridge,
  ColorBridge,
  HighlightBridge,
  CoreBridge,
].filter(
  (e) => !window.whiteListPlugins || window.whiteListPlugins.includes(e.name)
);

export default function Tiptap() {
  const editor = useTenTap({ bridges: tenTapExtensions });

  return <EditorContent editor={editor} />;
}

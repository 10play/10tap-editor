import { EditorContent } from '@tiptap/react';
import { useTenTap } from './useTenTap';

export default function Tiptap() {
  const editor = useTenTap();

  return <EditorContent editor={editor} />;
}

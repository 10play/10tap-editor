import DropCursor from '@tiptap/extension-dropcursor';
import BridgeExtension from './base';

export const DropCursorBridge = new BridgeExtension({
  tiptapExtension: DropCursor,
});

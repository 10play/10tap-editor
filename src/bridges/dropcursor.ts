import { Dropcursor } from '@tiptap/extensions';
import BridgeExtension from './base';

export const DropCursorBridge = new BridgeExtension({
  tiptapExtension: Dropcursor,
});

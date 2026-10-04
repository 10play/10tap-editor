import '../web/globals';
import { sendMessage as postToNative } from '../web/runtime';
import type { EditorMessage } from '../types/Messaging';

export { useTenTap, type UseTenTapArgs } from '../web/useTenTap';

/** Posts a message to the native side. */
export const sendMessage = (message: EditorMessage): void =>
  postToNative(message);

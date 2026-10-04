import type { Editor } from '@tiptap/core';
import Link from '@tiptap/extension-link';
import BridgeExtension from './base';
import { normalizeHref } from './normalizeHref';

type LinkEditorState = {
  isLinkActive: boolean;
  canSetLink: boolean;
  activeLink: string | undefined;
};

type LinkEditorInstance = {
  setLink: (link: string | null) => void;
};

declare module '../types/EditorBridge' {
  interface BridgeState extends LinkEditorState {}
  interface EditorBridge extends LinkEditorInstance {}
}

export enum LinkEditorActionType {
  SetLink = 'set-link',
}

type LinkMessage = {
  type: LinkEditorActionType.SetLink;
  payload: null | string;
};

/** Tiptap's own default, used for autolinks; typed links default to https. */
const TIPTAP_DEFAULT_PROTOCOL = 'http';

/** The `defaultProtocol` configured with `LinkBridge.configureExtension`, else https. */
const defaultProtocolOf = (editor: Editor): string | undefined => {
  const link = editor.extensionManager.extensions.find(
    (extension) => extension.name === Link.name
  );
  const configured: unknown = link?.options.defaultProtocol;
  return typeof configured === 'string' &&
    configured !== TIPTAP_DEFAULT_PROTOCOL
    ? configured
    : undefined;
};

export const LinkBridge = new BridgeExtension<
  LinkEditorState,
  LinkEditorInstance,
  LinkMessage
>({
  tiptapExtension: Link.configure({
    openOnClick: false,
    autolink: true,
  }),
  onBridgeMessage: (editor, { type, payload }) => {
    // null means the user cancelled.
    if (type !== LinkEditorActionType.SetLink || payload === null) {
      return false;
    }

    const href = normalizeHref(payload, defaultProtocolOf(editor));
    const chain = editor.chain().focus().extendMarkRange('link');
    (href === '' ? chain.unsetLink() : chain.setLink({ href }))
      .setTextSelection(editor.state.selection.from)
      .run();
    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => ({
    setLink: (link) =>
      sendBridgeMessage({
        type: LinkEditorActionType.SetLink,
        payload: link,
      }),
  }),
  extendEditorState: (editor) => ({
    canSetLink: !editor.state.selection.empty,
    isLinkActive: editor.isActive('link'),
    activeLink: editor.getAttributes('link').href,
  }),
});

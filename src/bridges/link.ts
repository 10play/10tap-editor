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

/** Link option holding a `defaultProtocol` set with `configureExtension`. */
const CONFIGURED_PROTOCOL = 'tentapConfiguredProtocol';

/**
 * TipTap's Link defaults `defaultProtocol` to 'http', which autolinks keep
 * using as in 1.0, while typed links default to https. The merged options
 * cannot tell a configured 'http' from that default, so `configure` also
 * records an explicit protocol under its own key.
 */
const linkExtension = Link.configure({ openOnClick: false, autolink: true });
const configureLink = linkExtension.configure.bind(linkExtension);
linkExtension.configure = (options = {}) =>
  configureLink(
    typeof options.defaultProtocol === 'string'
      ? Object.assign(
          { [CONFIGURED_PROTOCOL]: options.defaultProtocol },
          options
        )
      : options
  );

/** The `defaultProtocol` configured with `LinkBridge.configureExtension`. */
const configuredProtocolOf = (editor: Editor): string | undefined => {
  const link = editor.extensionManager.extensions.find(
    (extension) => extension.name === Link.name
  );
  const configured: unknown = link?.options[CONFIGURED_PROTOCOL];
  return typeof configured === 'string' ? configured : undefined;
};

export const LinkBridge = new BridgeExtension<
  LinkEditorState,
  LinkEditorInstance,
  LinkMessage
>({
  tiptapExtension: linkExtension,
  onBridgeMessage: (editor, { type, payload }) => {
    // null means the user cancelled.
    if (type !== LinkEditorActionType.SetLink || payload === null) {
      return false;
    }

    const href = normalizeHref(payload, configuredProtocolOf(editor));
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

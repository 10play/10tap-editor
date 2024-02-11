import Link from '@tiptap/extension-link';
import BridgeExtension from './base';

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
    if (type === LinkEditorActionType.SetLink) {
      // cancelled
      if (payload === null) {
        return false;
      }

      // empty
      if (payload === '') {
        editor
          .chain()
          .focus()
          .extendMarkRange('link')
          .unsetLink()
          .setTextSelection(editor.state.selection.from)
          .run();

        return false;
      }

      // update link
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: payload })
        .setTextSelection(editor.state.selection.from)
        .run();
    }

    return false;
  },
  extendEditorInstance: (sendBridgeMessage) => {
    return {
      setLink: (link) =>
        sendBridgeMessage({
          type: LinkEditorActionType.SetLink,
          payload: link,
        }),
    };
  },
  extendEditorState: (editor) => {
    return {
      canSetLink: !editor.state.selection.empty,
      isLinkActive: editor.isActive('link'),
      activeLink: editor.getAttributes('link').href,
    };
  },
});

// #290: deep imports of `src/` under node10 resolution (which ignores
// `exports`) never load the bridge files, so their `EditorBridge` and
// `BridgeState` augmentations must come in through the types themselves.
import type { ToolbarItem } from '@10play/tentap-editor/src/RichText/Toolbar/actions';
import type { EditorBridge } from '@10play/tentap-editor/src/types';

export const boldItem: ToolbarItem = {
  onPress:
    ({ editor }) =>
    () =>
      editor.toggleBold(),
  active: ({ editorState }) => editorState.isBoldActive,
  disabled: ({ editorState }) => !editorState.canToggleBold,
  image: () => null,
};

export const commands = (editor: EditorBridge) => {
  editor.toggleHeading(2);
  editor.setLink('https://10play.dev');
  editor.undo();
  return editor.getEditorState().headingLevel;
};

import { BridgeExtension } from '@10play/tentap-editor';
import CharacterCount from '@tiptap/extension-character-count';

type CounterEditorState = {
  wordCount: number;
  characterCount: number;
};

type CounterEditorInstance = {};

declare module '@10play/tentap-editor' {
  interface BridgeState extends CounterEditorState {}
  interface EditorBridge extends CounterEditorInstance {}
}

export const CounterBridge = new BridgeExtension<
  CounterEditorState,
  CounterEditorInstance,
  unknown
>({
  tiptapExtension: CharacterCount.configure({
    limit: 240,
  }),
  extendEditorState: (editor) => {
    return {
      wordCount: editor.storage.characterCount.characters(),
      characterCount: editor.storage.characterCount.words(),
    };
  },
});

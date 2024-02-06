import { TenTapBridge } from 'tentap';
import CharacterCount from '@tiptap/extension-character-count';

type CounterEditorState = {
  wordCount: number;
  characterCount: number;
};

type CounterEditorInstance = {};

declare module 'tentap' {
  interface EditorNativeState extends CounterEditorState {}
  interface EditorBridge extends CounterEditorInstance {}
}

export const CounterBridge = new TenTapBridge<
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

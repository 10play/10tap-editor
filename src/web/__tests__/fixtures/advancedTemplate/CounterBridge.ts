// The docs' CounterBridge. The `declare module` augmentation is left out: it
// only affects types, which test/fixtures/advanced-template already checks.
import { BridgeExtension } from './tentap';
import { CharacterCount } from '@tiptap/extensions';

type CounterEditorState = {
  wordCount: number;
  characterCount: number;
};

type CounterEditorInstance = {};

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

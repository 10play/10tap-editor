import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Extension } from '@tiptap/core';

/** Marks the selected range with `.highlight-background`. */
export const blueBackgroundPlugin = Extension.create({
  name: 'eventHandler',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('blueBackground'),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, _oldState, _oldEditorState, newEditorState) {
            if (tr.selection.empty) return DecorationSet.empty;
            const { from, to } = tr.selection;
            return DecorationSet.create(newEditorState.doc, [
              Decoration.inline(from, to, { class: 'highlight-background' }),
            ]);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});

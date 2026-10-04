import Code from '@tiptap/extension-code';
import {
  createToggleBridge,
  type ToggleInstance,
  type ToggleState,
} from './factories';

type CodeEditorState = ToggleState<'Code'>;

type CodeEditorInstance = ToggleInstance<'Code'>;

declare module '../types/EditorBridge' {
  interface BridgeState extends CodeEditorState {}
  interface EditorBridge extends CodeEditorInstance {}
}

export enum CodeEditorActionType {
  ToggleCode = 'toggle-code',
}

export const CodeBridge = createToggleBridge({
  label: 'Code',
  type: CodeEditorActionType.ToggleCode,
  tiptapExtension: Code,
  activeName: 'code',
  toggle: (chain) => chain.toggleCode(),
  extendCSS: `
    code {
        background-color: #6161611a;
        border-radius: 0.25em;
        box-decoration-break: clone;
        color: #616161;
        font-size: 0.9rem;
        padding: 0.25em;
    }
  `,
});

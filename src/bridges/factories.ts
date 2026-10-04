import type { AnyExtension, ChainedCommands } from '@tiptap/core';
import BridgeExtension from './base';

/** `is<Label>Active` and `canToggle<Label>`, e.g. `isBoldActive`. */
export type ToggleState<Label extends string> = Record<
  `is${Label}Active` | `canToggle${Label}`,
  boolean
>;

/** `toggle<Label>()`, e.g. `toggleBold()`. */
export type ToggleInstance<Label extends string> = Record<
  `toggle${Label}`,
  () => void
>;

export type ToggleMessage<Type extends string> = {
  type: Type;
  payload?: undefined;
};

interface ToggleBridgeOptions<Label extends string, Type extends string> {
  /** Suffix of the generated state keys and method. */
  label: Label;
  type: Type;
  tiptapExtension: AnyExtension;
  tiptapExtensionDeps?: AnyExtension[];
  /** Mark or node name passed to `editor.isActive`. */
  activeName: string;
  /** The toggle command, used both to run it and to check `can()`. */
  toggle: (chain: ChainedCommands) => ChainedCommands;
  extendCSS?: string;
}

/**
 * A bridge with one argument-less toggle command (bold, blockquote, bullet
 * list, …) and the matching `is<Label>Active` / `canToggle<Label>` state.
 */
export function createToggleBridge<Label extends string, Type extends string>({
  label,
  type,
  tiptapExtension,
  tiptapExtensionDeps,
  activeName,
  toggle,
  extendCSS,
}: ToggleBridgeOptions<Label, Type>) {
  return new BridgeExtension<
    ToggleState<Label>,
    ToggleInstance<Label>,
    ToggleMessage<Type>
  >({
    tiptapExtension,
    tiptapExtensionDeps,
    extendCSS,
    onBridgeMessage: (editor, message) => {
      if (message.type === type) {
        toggle(editor.chain().focus()).run();
      }
      return false;
    },
    extendEditorInstance: (sendBridgeMessage) =>
      ({
        [`toggle${label}`]: () => sendBridgeMessage({ type }),
      }) as ToggleInstance<Label>,
    extendEditorState: (editor) =>
      ({
        [`canToggle${label}`]: toggle(editor.can().chain()).run(),
        [`is${label}Active`]: editor.isActive(activeName),
      }) as ToggleState<Label>,
  });
}

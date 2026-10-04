import type { ComponentType } from 'react';
import { AppRegistry } from 'react-native';
import type { EditorBridge } from '../../types';

/** Props `CustomKeyboard` passes to a keyboard component. */
export interface CustomKeyboardComponentProps {
  editor: EditorBridge;
  /** Closes this keyboard and brings the system keyboard back. */
  close: () => void;
  /** Height of the keyboard area in dp. */
  keyboardHeight: number;
}

export interface CustomKeyboardExtensionOptions {
  /** Fixed height in dp instead of the last system keyboard height. */
  height?: number;
}

export class CustomKeyboardExtension<
  P extends object = CustomKeyboardComponentProps,
> {
  constructor(
    public id: string,
    public comp: ComponentType<P>,
    public options: CustomKeyboardExtensionOptions = {}
  ) {
    // Kept for 0.7.x apps that look keyboards up by id. The keyboard itself
    // renders in the app's own tree and no longer uses this registration.
    AppRegistry.registerComponent(id, () => comp);
  }
}

/**
 * A keyboard `CustomKeyboard` can render: its component takes all, some or
 * none of `CustomKeyboardComponentProps` (0.7.x components take none).
 */
export type AnyCustomKeyboardExtension =
  | CustomKeyboardExtension<CustomKeyboardComponentProps>
  | CustomKeyboardExtension<Partial<CustomKeyboardComponentProps>>
  | CustomKeyboardExtension<object>;

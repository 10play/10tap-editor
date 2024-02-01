import type { CustomKeyboardExtension } from './CustomKeyboardExtension';

export interface CustomKeyboardProps {
  rootRef: React.RefObject<any>;
  onKeyboardHideAndroid?: () => void;
  customKeyboard?: CustomKeyboardExtension;
}

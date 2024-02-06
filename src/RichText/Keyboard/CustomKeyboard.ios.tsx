import React from 'react';
import { TenTapView, useKeyboard } from '@10play/tentap-editor';
import { useRefHandle } from '../../utils/useRefHandle';
import type { CustomKeyboardExtension } from './CustomKeyboardExtension';

export interface CustomKeyboardIOSProps {
  rootRef: React.RefObject<any>;
  onKeyboardHideAndroid?: () => void;
  customKeyboard?: CustomKeyboardExtension;
}

export const CustomKeyboardIOS = ({
  rootRef,
  customKeyboard,
}: CustomKeyboardIOSProps) => {
  const refHandle = useRefHandle(rootRef);
  const { keyboardHeight } = useKeyboard();

  return (
    <TenTapView
      inputTag={customKeyboard ? refHandle : undefined}
      keyboardHeight={keyboardHeight}
      keyboardID={customKeyboard ? customKeyboard.id : undefined}
    />
  );
};

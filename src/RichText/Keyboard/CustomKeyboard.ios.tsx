import React from 'react';
import { processColor, type ColorValue } from 'react-native';
import { TenTapView, useKeyboard } from '@10play/tentap-editor';
import { useRefHandle } from '../../utils/useRefHandle';
import type { CustomKeyboardExtension } from './CustomKeyboardExtension';
export interface CustomKeyboardIOSProps {
  rootRef: React.RefObject<any>;
  onKeyboardHideAndroid?: () => void;
  customKeyboard?: CustomKeyboardExtension;
  rootBackground?: ColorValue;
}

export const CustomKeyboardIOS = ({
  rootRef,
  customKeyboard,
  rootBackground,
}: CustomKeyboardIOSProps) => {
  const refHandle = useRefHandle(rootRef);
  const { keyboardHeight } = useKeyboard();
  return (
    <TenTapView
      inputTag={customKeyboard ? refHandle : undefined}
      keyboardHeight={keyboardHeight}
      keyboardID={customKeyboard ? customKeyboard.id : undefined}
      rootBackground={processColor(rootBackground) as unknown as number}
    />
  );
};

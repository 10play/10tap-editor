import React, { useEffect } from 'react';
import { TenTapView, useKeyboard } from 'tentap';
import type { CustomKeyboardExtension } from './CustomKeyboardExtension';

export interface CustomKeyboardAndroidProps {
  rootRef: React.RefObject<any>;
  onKeyboardHideAndroid?: () => void;
  customKeyboard?: CustomKeyboardExtension;
}

export const CustomKeyboardAndroid = ({
  customKeyboard,
  onKeyboardHideAndroid,
}: CustomKeyboardAndroidProps) => {
  const { keyboardHeight, isKeyboardUp } = useKeyboard();

  useEffect(() => {
    if (isKeyboardUp) {
      onKeyboardHideAndroid && onKeyboardHideAndroid();
    }
  }, [isKeyboardUp, onKeyboardHideAndroid]);

  return (
    // Keyboard height is not used on native in android
    <TenTapView keyboardHeight={0} style={{ height: keyboardHeight }}>
      {customKeyboard && <customKeyboard.comp />}
    </TenTapView>
  );
};

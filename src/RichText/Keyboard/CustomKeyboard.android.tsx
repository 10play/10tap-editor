import React, { useEffect } from 'react';
import { TenTapView, useKeyboard } from '@10play/tentap-editor';
import type { CustomKeyboardExtension } from './CustomKeyboardExtension';
import { isFabric } from '../../utils/misc';

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

  // On fabric we want to change keyboard visibility from js side
  // See: https://github.com/10play/10tap-editor/pull/74
  const display = isFabric() ? (customKeyboard ? 'flex' : 'none') : undefined;

  return (
    // Keyboard height is not used on native in android
    <TenTapView
      keyboardHeight={0}
      style={{
        height: keyboardHeight,
        display,
      }}
    >
      {customKeyboard && <customKeyboard.comp />}
    </TenTapView>
  );
};

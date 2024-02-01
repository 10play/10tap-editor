import React, { useEffect } from 'react';
import { TenTapView, ToolbarContext, useKeyboard } from 'tentap';
import type { CustomKeyboardProps } from './types';
import { ColorKeyboard } from './ColorKeyboard';

export const CustomKeyboardAndroid = ({
  color,
  setToolbarContext,
}: CustomKeyboardProps) => {
  const { keyboardHeight, isKeyboardUp } = useKeyboard();

  useEffect(() => {
    if (isKeyboardUp) {
      // If keyboard is up reset toolbar state
      setToolbarContext(ToolbarContext.Main);
    }
  }, [isKeyboardUp, setToolbarContext]);

  return (
    // Keyboard height is not used on native in android
    <TenTapView keyboardHeight={0} style={{ height: keyboardHeight }}>
      {color && <ColorKeyboard />}
    </TenTapView>
  );
};

import React from 'react';
import { TenTapView, useKeyboard } from 'tentap';
import { useRefHandle } from '../../utils/useRefHandle';
import type { CustomKeyboardProps } from './types';

export const CustomKeyboardIOS = ({ rootRef, color }: CustomKeyboardProps) => {
  const refHandle = useRefHandle(rootRef);
  const { keyboardHeight } = useKeyboard();
  return (
    <TenTapView
      inputTag={color ? refHandle : undefined}
      keyboardHeight={keyboardHeight}
    />
  );
};

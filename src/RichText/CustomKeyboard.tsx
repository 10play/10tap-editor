import React from 'react';
import { useEffect } from 'react';
import { TenTapView, useKeyboardUp } from 'tentap';
import { useRefHandle } from '../utils/useRefHandle';

interface CustomKeyboardProps {
  rootRef: React.RefObject<any>;
  color: boolean;
}

export const CustomKeyboard = ({ rootRef, color }: CustomKeyboardProps) => {
  const refHandle = useRefHandle(rootRef);
  const isKeyboardUp = useKeyboardUp();

  useEffect(() => {}, [isKeyboardUp]);

  return <TenTapView inputTag={color ? refHandle : undefined} />;
};

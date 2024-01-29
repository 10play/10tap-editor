import React from 'react';
import { TenTapView } from 'tentap';
import { useRefHandle } from '../../utils/useRefHandle';
import { Keyboard } from 'react-native';
import type { CustomKeyboardProps } from './types';

const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  React.useEffect(() => {
    const listener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    return () => listener.remove();
  }, []);
  return keyboardHeight;
};

export const CustomKeyboardIOS = ({ rootRef, color }: CustomKeyboardProps) => {
  const refHandle = useRefHandle(rootRef);
  const keyboardHeight = useKeyboardHeight();
  return (
    <TenTapView
      inputTag={color ? refHandle : undefined}
      keyboardHeight={keyboardHeight}
    />
  );
};

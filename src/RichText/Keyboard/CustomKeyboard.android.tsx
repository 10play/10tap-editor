import React from 'react';
import { TenTapView } from 'tentap';
import { Keyboard, View } from 'react-native';
import type { CustomKeyboardProps } from './types';
import { ColorKeyboard } from './ColorKeyboard';

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

export const CustomKeyboardAndroid = ({ color }: CustomKeyboardProps) => {
  const keyboardHeight = useKeyboardHeight();

  return (
    // Keyboard height is not used on native in android
    <TenTapView keyboardHeight={0}>
      {color && (
        <View style={{ height: keyboardHeight }}>
          <ColorKeyboard />
        </View>
      )}
    </TenTapView>
  );
};

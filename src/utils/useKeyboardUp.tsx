import React from 'react';
import { useEffect } from 'react';
import { Keyboard } from 'react-native';

export const useKeyboardUp = () => {
  const [isKeyboardUp, setIsKeyboardUp] = React.useState<number | undefined>(
    undefined
  );
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardWillShow', (e) => {
      setIsKeyboardUp(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener('keyboardWillHide', () => {
      setIsKeyboardUp(undefined);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return isKeyboardUp;
};

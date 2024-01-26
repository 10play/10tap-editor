import React from 'react';
import { useEffect } from 'react';
import { Keyboard } from 'react-native';

export const useKeyboardUp = () => {
  const [isKeyboardUp, setIsKeyboardUp] = React.useState(false);
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardWillShow', () => {
      setIsKeyboardUp(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardWillHide', () => {
      setIsKeyboardUp(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return isKeyboardUp;
};

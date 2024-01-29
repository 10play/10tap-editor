import React from 'react';
import { useEffect } from 'react';
import type { KeyboardEventName } from 'react-native';
import { Keyboard, Platform } from 'react-native';

const showEvent: KeyboardEventName =
  Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const hideEvent: KeyboardEventName =
  Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

export const useKeyboardUp = () => {
  const [isKeyboardUp, setIsKeyboardUp] = React.useState(false);
  useEffect(() => {
    const showSubscription = Keyboard.addListener(showEvent, () => {
      setIsKeyboardUp(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardUp(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return isKeyboardUp;
};

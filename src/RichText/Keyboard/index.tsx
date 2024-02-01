import React, { useCallback } from 'react';
import { Platform } from 'react-native';
import { CustomKeyboardAndroid } from './CustomKeyboard.android';
import { CustomKeyboardIOS } from './CustomKeyboard.ios';
import type { CustomKeyboardExtension } from './CustomKeyboardExtension';

interface CustomKeyboardProps {
  rootRef: React.RefObject<any>;
  keyboards: CustomKeyboardExtension[];
  setActiveKeyboardID: (id: string | undefined) => void;
  activeKeyboardID?: string;
}
export const CustomKeyboard = ({
  keyboards,
  activeKeyboardID,
  setActiveKeyboardID,
  rootRef,
}: CustomKeyboardProps) => {
  const customKeyboard =
    (activeKeyboardID && keyboards.find((k) => k.id === activeKeyboardID)) ||
    undefined;

  const onKeyboardHideAndroid = useCallback(() => {
    setActiveKeyboardID(undefined);
  }, [setActiveKeyboardID]);

  if (Platform.OS === 'ios') {
    return (
      <CustomKeyboardIOS rootRef={rootRef} customKeyboard={customKeyboard} />
    );
  }
  return (
    <CustomKeyboardAndroid
      rootRef={rootRef}
      customKeyboard={customKeyboard}
      onKeyboardHideAndroid={onKeyboardHideAndroid}
    />
  );
};

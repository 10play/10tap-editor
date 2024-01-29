import React from 'react';
import { Platform } from 'react-native';
import { CustomKeyboardAndroid } from './CustomKeyboard.android';
import { CustomKeyboardIOS } from './CustomKeyboard.ios';
import type { CustomKeyboardProps } from './types';
import { register } from './keyboards';

register();

export const CustomKeyboard = (props: CustomKeyboardProps) => {
  if (Platform.OS === 'ios') {
    return <CustomKeyboardIOS {...props} />;
  }
  return <CustomKeyboardAndroid {...props} />;
};

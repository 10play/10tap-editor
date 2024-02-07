import React from 'react';
import { CustomKeyboardExtension } from '@10play/tentap-editor';
import { Image, StyleSheet, View } from 'react-native';
import { Images } from '../../../../src/assets';

const keyboardStyles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
});

const StickerKeyboardComp = () => {
  return (
    <View style={keyboardStyles.keyboardContainer}>
      <Image source={Images.checkList} style={{ width: 100, height: 100 }} />
    </View>
  );
};

export const StickerKeyboard = new CustomKeyboardExtension(
  'keyboard.sticker',
  StickerKeyboardComp
);

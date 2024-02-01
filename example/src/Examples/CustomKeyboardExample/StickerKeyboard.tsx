import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { CustomKeyboardExtension } from '../../../../src/RichText/Keyboard/CustomKeyboardExtension';
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

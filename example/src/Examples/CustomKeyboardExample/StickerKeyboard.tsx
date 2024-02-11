import React from 'react';
import { CustomKeyboardExtension, EditorHelper } from '@10play/tentap-editor';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

const keyboardStyles = StyleSheet.create({
  keyboardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

const stickersTop = [
  'https://res.cloudinary.com/dkofpy6k6/image/upload/c_fill,g_auto,h_100,w_100/v1707657614/7c1d68c9-126c-4967-a6a4-7252e998802d.png',
  'https://res.cloudinary.com/dkofpy6k6/image/upload/c_fill,g_auto,h_100,w_100/v1707657441/skel_uv9mo1.png',
  'https://res.cloudinary.com/dkofpy6k6/image/upload/c_fill,g_auto,h_100,w_100/v1707657821/ecee86ed-6291-412c-9570-2b561314d723.png',
];
const stickersBottom = [
  'https://res.cloudinary.com/dkofpy6k6/image/upload/c_fill,g_auto,h_100,w_100/v1707658182/53b06114-544c-4048-869f-fedbc6d51bb9.png',
  'https://res.cloudinary.com/dkofpy6k6/image/upload/c_fill,g_auto,h_100,w_100/v1707658198/75fe11eb-1d93-45e4-bb97-d8e26dbe4335.png',
  'https://res.cloudinary.com/dkofpy6k6/image/upload/c_fill,g_auto,h_100,w_100/v1707658214/c6cadcf3-785c-49ec-b34d-c6d8ea544153.png',
];

const StickerRow = ({ stickers }: { stickers: string[] }) => {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {stickers.map((sticker, index) => (
        <TouchableOpacity
          key={index}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => EditorHelper.editorLastInstance?.setImage(sticker)}
        >
          <Image
            source={{ uri: sticker }}
            style={{ width: 100, height: 100 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const StickerKeyboardComp = () => {
  return (
    <View style={keyboardStyles.keyboardContainer}>
      <StickerRow stickers={stickersTop} />
      <StickerRow stickers={stickersBottom} />
    </View>
  );
};

export const StickerKeyboard = new CustomKeyboardExtension(
  'keyboard.sticker',
  StickerKeyboardComp
);

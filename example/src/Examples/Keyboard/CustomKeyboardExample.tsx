import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ColorKeyboard,
  CustomKeyboard,
  EditorKeyboardAvoidingView,
  CustomKeyboardExtension,
  ImageBridge,
  RichText,
  TenTapStartKit,
  useEditorBridge,
  type CustomKeyboardComponentProps,
} from '@10play/tentap-editor';
import { BottomInsetSpacer } from '../../ui/keyboardLayout';
import { layoutStyles } from '../../ui/styles';
import { paper, radii, spacing } from '../../ui/theme';
import { KeyboardDebugBar } from './KeyboardDebugBar';
import {
  KeyboardSwitcher,
  colorKeyboardEntry,
  type SwitcherEntry,
} from './KeyboardSwitcher';

const stickers = [
  'https://res.cloudinary.com/dkofpy6k6/image/upload/c_fill,g_auto,h_100,w_100/v1707657614/7c1d68c9-126c-4967-a6a4-7252e998802d.png',
  'https://res.cloudinary.com/dkofpy6k6/image/upload/c_fill,g_auto,h_100,w_100/v1707657441/skel_uv9mo1.png',
  'https://res.cloudinary.com/dkofpy6k6/image/upload/c_fill,g_auto,h_100,w_100/v1707657821/ecee86ed-6291-412c-9570-2b561314d723.png',
  'https://res.cloudinary.com/dkofpy6k6/image/upload/c_fill,g_auto,h_100,w_100/v1707658182/53b06114-544c-4048-869f-fedbc6d51bb9.png',
  'https://res.cloudinary.com/dkofpy6k6/image/upload/c_fill,g_auto,h_100,w_100/v1707658198/75fe11eb-1d93-45e4-bb97-d8e26dbe4335.png',
  'https://res.cloudinary.com/dkofpy6k6/image/upload/c_fill,g_auto,h_100,w_100/v1707658214/c6cadcf3-785c-49ec-b34d-c6d8ea544153.png',
];

// Counts sticker keyboard mounts, so the E2E flow can check that every open
// mounts it and every close unmounts it (#51).
const lifecycle = { mounts: 0, unmounts: 0 };

const StickerKeyboardComp = ({ editor }: CustomKeyboardComponentProps) => {
  useEffect(() => {
    lifecycle.mounts++;
    return () => {
      lifecycle.unmounts++;
    };
  }, []);

  return (
    <View style={styles.stickers}>
      {stickers.map((sticker, index) => (
        <TouchableOpacity
          key={sticker}
          testID={`sticker-${index}`}
          style={styles.sticker}
          onPress={() => editor.setImage(sticker)}
        >
          <Image source={{ uri: sticker }} style={styles.stickerImage} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export const StickerKeyboard = new CustomKeyboardExtension(
  'keyboard.sticker',
  StickerKeyboardComp
);

/**
 * A custom sticker keyboard next to ColorKeyboard, switched from a bar that
 * uses `useCustomKeyboard`.
 */
export const CustomKeyboardExample = () => {
  const editor = useEditorBridge({
    avoidIosKeyboard: true,
    autofocus: true,
    initialContent: '<p>Pick a sticker or a color.</p>',
    bridgeExtensions: [
      ...TenTapStartKit,
      ImageBridge.configureExtension({ inline: true }),
    ],
  });
  const [activeKeyboard, setActiveKeyboard] = useState<string>();

  return (
    <SafeAreaView style={styles.fullScreen} edges={['top']}>
      <KeyboardDebugBar
        editor={editor}
        details={() =>
          `mounts:${lifecycle.mounts} unmounts:${lifecycle.unmounts}`
        }
      />
      <View style={layoutStyles.paper}>
        <RichText editor={editor} testID="keyboard-example-editor" />
      </View>
      {/* In the column below the editor, not over it, so the switcher never
          hides the last line while the keyboard is down. */}
      <EditorKeyboardAvoidingView>
        <KeyboardSwitcher editor={editor} entries={switcherEntries} />
        <CustomKeyboard
          editor={editor}
          keyboards={[StickerKeyboard, ColorKeyboard]}
          activeKeyboardID={activeKeyboard}
          setActiveKeyboardID={setActiveKeyboard}
        />
        <BottomInsetSpacer />
      </EditorKeyboardAvoidingView>
    </SafeAreaView>
  );
};

const switcherEntries: SwitcherEntry[] = [
  {
    keyboard: StickerKeyboard,
    label: 'Stickers',
    testID: 'toggle-sticker-keyboard',
  },
  colorKeyboardEntry,
];

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  stickers: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: paper.bar,
  },
  sticker: {
    width: '28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: paper.background,
  },
  stickerImage: {
    width: '70%',
    height: '70%',
  },
});

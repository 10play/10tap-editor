import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ColorKeyboard,
  CustomKeyboard,
  CustomKeyboardExtension,
  ImageBridge,
  RichText,
  TenTapStartKit,
  useCustomKeyboard,
  useEditorBridge,
  type CustomKeyboardComponentProps,
  type EditorBridge,
} from '@10play/tentap-editor';

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
      <DebugBar editor={editor} />
      <View style={styles.fullScreen}>
        <RichText editor={editor} testID="keyboard-example-editor" />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <KeyboardSwitcher editor={editor} />
        <CustomKeyboard
          editor={editor}
          keyboards={[StickerKeyboard, ColorKeyboard]}
          activeKeyboardID={activeKeyboard}
          setActiveKeyboardID={setActiveKeyboard}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const KeyboardSwitcher = ({ editor }: { editor: EditorBridge }) => {
  const { activeKeyboardID, open, close } = useCustomKeyboard(editor);
  const toggle = (id: string) => (activeKeyboardID === id ? close() : open(id));
  return (
    <View style={styles.switcher}>
      <SwitcherButton
        label="Stickers"
        testID="toggle-sticker-keyboard"
        active={activeKeyboardID === StickerKeyboard.id}
        onPress={() => toggle(StickerKeyboard.id)}
      />
      <SwitcherButton
        label="Colors"
        testID="toggle-color-keyboard"
        active={activeKeyboardID === ColorKeyboard.id}
        onPress={() => toggle(ColorKeyboard.id)}
      />
    </View>
  );
};

const SwitcherButton = ({
  label,
  testID,
  active,
  onPress,
}: {
  label: string;
  testID: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable
    testID={testID}
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
    onPress={onPress}
    style={[styles.switcherButton, active && styles.switcherButtonActive]}
  >
    <Text>{label}</Text>
  </Pressable>
);

/** Shows the document HTML and the keyboard mount counters for E2E checks. */
const DebugBar = ({ editor }: { editor: EditorBridge }) => {
  const [html, setHtml] = useState('');
  const [counts, setCounts] = useState(lifecycle);
  return (
    <View style={styles.debugBar}>
      <Pressable
        testID="read-editor-state"
        onPress={async () => {
          setHtml(await editor.getHTML());
          setCounts({ ...lifecycle });
        }}
      >
        <Text>Read state</Text>
      </Pressable>
      <Text testID="keyboard-lifecycle">{`mounts:${counts.mounts} unmounts:${counts.unmounts}`}</Text>
      <Text testID="editor-html" numberOfLines={3}>
        {html}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: 'white',
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
  stickers: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sticker: {
    width: '33%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerImage: {
    width: 80,
    height: 80,
  },
  switcher: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C8C8C9',
  },
  switcherButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  switcherButtonActive: {
    backgroundColor: '#DEE0E3',
  },
  debugBar: {
    padding: 8,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C8C8C9',
  },
});

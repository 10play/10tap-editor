import React, { useEffect, useMemo, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import {
  ColorBridge,
  DEFAULT_TOOLBAR_ITEMS,
  HighlightBridge,
  LinkBridge,
  RichText,
  TaskListBridge,
  TenTapStartKit,
  Toolbar,
  UnderlineBridge,
  useEditor,
  useEditorState,
  type EditorInstance,
} from 'tentap';
import { CustomKeyboard } from '../../src/RichText/Keyboard';
import { CustomKeyboardExtension } from '../../src/RichText/Keyboard/CustomKeyboardExtension';
import { Images } from '../../src/assets';
import { ColorKeyboard } from '../../src/RichText/Keyboard/ColorKeyboard';

// const exampleOfSmallEditorStyles = {
//   height: 100,
//   width: 200,
//   borderWidth: 1,
//   borderColor: 'black',
// };

// const exampleOfFullScreenEditorStyles = {
//   flex: 1,
// };
function App() {
  // Editor is basically a ref to the webview with extra functions (might be confusing?)
  const editor = useEditor({
    plugins: [
      TenTapStartKit,
      UnderlineBridge,
      TaskListBridge,
      LinkBridge,
      ColorBridge,
      HighlightBridge,
    ],
  });
  const TapRef = useRef(null);

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center' }} ref={TapRef}>
      {/* <TextInput onFocus={() => setHideToolbar(true)} onBlur={() => setHideToolbar(false)} /> */}
      {/* <View style={{ ...exampleOfFullScreenEditorStyles }}> */}
      <RichText editor={editor} DEV />
      <TB editor={editor} tapRef={TapRef} />
    </SafeAreaView>
  );
}

const MyKeyboard = new CustomKeyboardExtension('custom', () => {
  return (
    <View style={{ flex: 1 }}>
      <Text>Custom Keyboard</Text>
    </View>
  );
});

const TB = ({
  editor,
  tapRef,
}: {
  editor: EditorInstance;
  tapRef: React.MutableRefObject<null>;
}) => {
  const editorState = useEditorState(editor);
  const [hideToolbar, _setHideToolbar] = React.useState(false);
  const [activeKeyboard, setActiveKeyboard] = React.useState<string>();

  useEffect(() => {
    if (editorState.isFocused) {
      setActiveKeyboard(undefined);
    }
  }, [editorState.isFocused]);

  const toolbarItems = useMemo(() => {
    return [
      {
        active: () => activeKeyboard === MyKeyboard.id,
        disabled: () => false,
        onPress:
          ({ editor }) =>
          () => {
            const isActive = activeKeyboard === MyKeyboard.id;
            if (isActive) editor.webviewRef.current?.requestFocus();
            setActiveKeyboard(isActive ? undefined : MyKeyboard.id);
          },
        image: () => Images.bold,
      },
      {
        onPress:
          ({ editor }) =>
          () => {
            const isActive = activeKeyboard === ColorKeyboard.id;
            if (isActive) editor.webviewRef.current?.requestFocus();
            setActiveKeyboard(isActive ? undefined : ColorKeyboard.id);
          },
        active: () => activeKeyboard === ColorKeyboard.id,
        disabled: () => false,
        image: () => Images.platte,
      },
      ...DEFAULT_TOOLBAR_ITEMS,
    ];
  }, [activeKeyboard]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{
        position: 'absolute',
        width: '100%',
        bottom: 0,
      }}
    >
      <Toolbar editor={editor} hidden={hideToolbar} items={toolbarItems} />
      <CustomKeyboard
        rootRef={tapRef}
        activeKeyboardID={activeKeyboard}
        setActiveKeyboardID={setActiveKeyboard}
        keyboards={[ColorKeyboard, MyKeyboard]}
      />
    </KeyboardAvoidingView>
  );
};

export default App;

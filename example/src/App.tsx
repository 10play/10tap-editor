import React, { useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  View,
} from 'react-native';
import {
  ColorBridge,
  HighlightBridge,
  LinkBridge,
  RichText,
  TaskListBridge,
  TenTapStartKit,
  Toolbar,
  UnderlineBridge,
  useEditor,
} from 'tentap';
import { CustomKeyboard } from '../../src/RichText/Keyboard';
import { ColorKeyboard } from '../../src/RichText/Keyboard/ColorKeyboard';

// const exampleOfSmallEditorStyles = {
//   height: 100,
//   width: 200,
//   borderWidth: 1,
//   borderColor: 'black',
// };

const exampleOfFullScreenEditorStyles = {
  flex: 1,
};
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
  const [activeKeyboard, setActiveKeyboard] = React.useState<string>();

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center' }} ref={TapRef}>
      {/* <TextInput onFocus={() => setHideToolbar(true)} onBlur={() => setHideToolbar(false)} /> */}
      {/* <View style={{ ...exampleOfFullScreenEditorStyles }}> */}
      <View style={exampleOfFullScreenEditorStyles}>
        <RichText autofocus avoidIosKeyboard editor={editor} DEV />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          position: 'absolute',
          width: '100%',
          bottom: 0,
        }}
      >
        <Toolbar
          activeKeyboard={activeKeyboard}
          setActiveKeyboard={setActiveKeyboard}
          editor={editor}
          hidden={false}
        />
        <CustomKeyboard
          rootRef={TapRef}
          activeKeyboardID={activeKeyboard}
          setActiveKeyboardID={setActiveKeyboard}
          keyboards={[ColorKeyboard]}
          editor={editor}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default App;

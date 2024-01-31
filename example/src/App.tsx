import React, { useRef } from 'react';
import { SafeAreaView, View } from 'react-native';
import {
  RichText,
  TaskListBridge,
  TenTapStartKit,
  Toolbar,
  UnderlineBridge,
  // UnderlineBridge,
  useEditor,
  useKeyboardUp,
} from 'tentap';

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
    plugins: [TenTapStartKit, UnderlineBridge, TaskListBridge],
  });

  const isKeyboardUp = useKeyboardUp();
  const [hideToolbar, _setHideToolbar] = React.useState(false);
  const TapRef = useRef(null);

  const toolbarVisible = !!isKeyboardUp && !hideToolbar;

  return (
    <SafeAreaView style={{ ...exampleOfFullScreenEditorStyles }} ref={TapRef}>
      <View style={{ ...exampleOfFullScreenEditorStyles }}>
        <RichText avoidIosKeyboard editor={editor} DEV />
      </View>
      <Toolbar editor={editor} visible={toolbarVisible} rootRef={TapRef} />
    </SafeAreaView>
  );
}

export default App;

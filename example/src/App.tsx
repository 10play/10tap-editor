import React, { useRef } from 'react';
import { SafeAreaView } from 'react-native';
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
  const [hideToolbar, _setHideToolbar] = React.useState(false);
  const TapRef = useRef(null);

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center' }} ref={TapRef}>
      {/* <TextInput onFocus={() => setHideToolbar(true)} onBlur={() => setHideToolbar(false)} /> */}
      {/* <View style={{ ...exampleOfFullScreenEditorStyles }}> */}
      <RichText editor={editor} DEV />
      <Toolbar editor={editor} hidden={hideToolbar} rootRef={TapRef} />
    </SafeAreaView>
  );
}

export default App;

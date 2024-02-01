import React, { useRef } from 'react';
import { SafeAreaView } from 'react-native';
import { RichText, Toolbar, useEditor, useKeyboard } from 'tentap';

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
  const editor = useEditor();
  const { isKeyboardUp } = useKeyboard();
  const [hideToolbar, _setHideToolbar] = React.useState(false);
  const TapRef = useRef(null);

  const toolbarVisible = isKeyboardUp && !hideToolbar;
  console.log(toolbarVisible);

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center' }} ref={TapRef}>
      {/* <TextInput onFocus={() => setHideToolbar(true)} onBlur={() => setHideToolbar(false)} /> */}
      {/* <View style={{ ...exampleOfFullScreenEditorStyles }}> */}
      <RichText editor={editor} DEV />
      <Toolbar editor={editor} visible={true} rootRef={TapRef} />
    </SafeAreaView>
  );
}

export default App;

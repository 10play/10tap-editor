import React, { useEffect, useRef, useState } from 'react';
import {
  // Button,
  // Keyboard,
  SafeAreaView,
  // View,
  findNodeHandle,
} from 'react-native';
import {
  RichText,
  TenTapView,
  // Toolbar,
  useEditor,
  // useKeyboardUp,
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
  const editor = useEditor();
  // const isKeyboardUp = useKeyboardUp();
  // const [hideToolbar, _setHideToolbar] = React.useState(false);
  // const [color, setColor] = React.useState('#32a852');
  // const [speed, setSpeed] = React.useState(1000);
  const TapRef = useRef(null);
  const [inputTag, setInputTag] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (TapRef.current) {
      const reactTag = findNodeHandle(TapRef.current);
      if (reactTag) setInputTag(reactTag);
      console.log(reactTag);
    }
  }, [inputTag]);

  // const toolbarVisible = isKeyboardUp && !hideToolbar;

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center' }} ref={TapRef}>
      {/* <TextInput onFocus={() => setHideToolbar(true)} onBlur={() => setHideToolbar(false)} /> */}
      {/* <View style={{ ...exampleOfFullScreenEditorStyles }}> */}
      {/* Native Fabric (with old arch support) View */}
      <TenTapView
        style={{ flex: 1 }}
        text="Hey"
        placeholder="TypeHersddffssde"
        inputTag={inputTag}
      >
        <RichText editor={editor} DEV />
      </TenTapView>
      {/* <RichText editor={editor} DEV /> */}
      {/* </View> */}
      {/* <Toolbar editor={editor} visible={toolbarVisible} /> */}
    </SafeAreaView>
  );
}

export default App;

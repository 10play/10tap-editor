import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  // Button,
  // Keyboard,
  SafeAreaView,
  View,
  // View,
  findNodeHandle,
} from 'react-native';
import {
  RichText,
  TenTapView,
  // Toolbar,
  useEditor,
  useKeyboardUp,
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
  const isKeyboardUp = useKeyboardUp();
  // const [hideToolbar, _setHideToolbar] = React.useState(false);
  // const [color, setColor] = React.useState('#32a852');
  // const [speed, setSpeed] = React.useState(1000);
  const TapRef = useRef(null);
  const inputTagRef = useRef<number | undefined>(undefined);
  const [inputTag, setInputTag] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!isKeyboardUp) {
      setInputTag(undefined);
    }
  }, [isKeyboardUp]);

  useEffect(() => {
    if (TapRef.current) {
      const reactTag = findNodeHandle(TapRef.current);
      if (reactTag) inputTagRef.current = reactTag;
      console.log(reactTag);
    }
  }, [inputTag]);

  // const toolbarVisible = isKeyboardUp && !hideToolbar;

  return (
    <>
      <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
        {/* <TextInput onFocus={() => setHideToolbar(true)} onBlur={() => setHideToolbar(false)} /> */}
        {/* <View style={{ ...exampleOfFullScreenEditorStyles }}> */}
        {/* Native Fabric (with old arch support) View */}
        <View ref={TapRef} style={{ flex: 1 }}>
          <RichText editor={editor} DEV />
          <Button
            title="Click"
            onPress={() => {
              setInputTag(inputTagRef.current);
            }}
          />
        </View>
        {/* <RichText editor={editor} DEV /> */}
        {/* </View> */}
        {/* <Toolbar editor={editor} visible={toolbarVisible} /> */}
      </SafeAreaView>
      <TenTapView
        style={{ flex: 1 }}
        text="Hey"
        placeholder="TypeHersddffssde"
        inputTag={inputTag}
      ></TenTapView>
    </>
  );
}

export default App;

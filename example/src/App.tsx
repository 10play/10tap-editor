import React from 'react';
import { SafeAreaView, View } from 'react-native';
import { RichText, Toolbar, useEditor, useKeyboardUp } from 'tentap';

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
  const editor = useEditor();
  const isKeyboardUp = useKeyboardUp();
  const [hideToolbar, _setHideToolbar] = React.useState(false);

  const toolbarVisible = isKeyboardUp && !hideToolbar;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* <TextInput onFocus={() => setHideToolbar(true)} onBlur={() => setHideToolbar(false)} /> */}
      {/* Native Fabric (with old arch support) View */}
      <View style={{ ...exampleOfFullScreenEditorStyles }}>
        {/* <TenTapView color="#32a852" style={{ width: 50, height: 50 }} /> */}
        <RichText editor={editor} DEV />
      </View>
      <Toolbar editor={editor} visible={toolbarVisible} />
    </SafeAreaView>
  );
}

export default App;

import React from 'react';
import { TenTapView } from 'tentap';
import { useRefHandle } from '../utils/useRefHandle';
import { Keyboard, View } from 'react-native';
import { AppRegistry } from 'react-native';
import { StyleSheet } from 'react-native';
import { ScrollView } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Text } from 'react-native';
import { EditorHelper } from './EditorHelper';

const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  React.useEffect(() => {
    const listener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    return () => listener.remove();
  }, []);
  return keyboardHeight;
};

interface CustomKeyboardProps {
  rootRef: React.RefObject<any>;
  color: boolean;
}

export const CustomKeyboard = ({ rootRef, color }: CustomKeyboardProps) => {
  const refHandle = useRefHandle(rootRef);
  const keyboardHeight = useKeyboardHeight();
  return (
    <TenTapView
      inputTag={color ? refHandle : undefined}
      keyboardHeight={keyboardHeight}
    />
  );
};

const colors = [
  'red',
  'green',
  'blue',
  'yellow',
  'purple',
  'orange',
  'pink',
  'brown',
  'grey',
  'cyan',
  'magenta',
  'lime',
  'indigo',
  'violet',
  'navy',
  'olive',
  'teal',
  'maroon',
  'coral',
  'fuchsia',
  'wheat',
  'lavender',
  'khaki',
  'gold',
  'plum',
  // 'sienna',
  // 'tan',
  // 'peach',
  // 'mint',
  // 'skyblue',
];

const ColorKeyboard = () => {
  const activeColor =
    EditorHelper.editorLastInstance?.getEditorState().activeColor;
  const activeHighlight =
    EditorHelper.editorLastInstance?.getEditorState().activeHighlight;
  return (
    <View style={keyboardStyles.keyboardContainer}>
      <Text style={styles.listHead}>Color:</Text>
      <View style={[styles.list, styles.firstList]}>
        <ScrollView horizontal style={styles.container}>
          {colors.map((color, index) => (
            <CustomButton
              key={index}
              onPress={() => {
                EditorHelper.editorLastInstance &&
                  EditorHelper.editorLastInstance.changeColor(color);
                EditorHelper.editorLastInstance &&
                  EditorHelper.editorLastInstance.webviewRef.current?.requestFocus();
              }}
              isActive={color === activeColor}
              backgroundColor={color}
            />
          ))}
        </ScrollView>
      </View>
      <Text style={styles.listHead}>Highlight:</Text>
      <View style={styles.list}>
        <ScrollView horizontal style={styles.container}>
          {colors.map((color, index) => (
            <CustomButton
              key={index}
              onPress={() => {
                EditorHelper.editorLastInstance &&
                  EditorHelper.editorLastInstance.changeHighlight(color);
                EditorHelper.editorLastInstance &&
                  EditorHelper.editorLastInstance.webviewRef.current?.requestFocus();
              }}
              isActive={color === activeHighlight}
              backgroundColor={color}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

// @ts-ignore
const CustomButton = ({ onPress, backgroundColor, isActive }) => (
  <TouchableOpacity
    style={[
      styles.button,
      { backgroundColor },
      ...(isActive ? [styles.activeButton] : []),
    ]}
    onPress={onPress}
  />
);
const styles = StyleSheet.create({
  container: {
    height: 50,
  },
  listHead: {
    paddingLeft: 10,
  },
  list: {
    height: 60,
  },
  firstList: {
    marginBottom: 50,
  },
  button: {
    margin: 10,
    padding: 15,
    width: 50,
    height: 50,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    borderWidth: 1,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});
const keyboardStyles = StyleSheet.create({
  keyboardContainer: {
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
});

AppRegistry.registerComponent('keyboard.color', () => ColorKeyboard);

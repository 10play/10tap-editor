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
  'sienna',
  'tan',
  'peach',
  'mint',
  'skyblue',
];

const ColorKeyboard = () => {
  return (
    <View style={keyboardStyles.keyboardContainer}>
      <ScrollView style={styles.container}>
        {colors.map((color, index) => (
          <CustomButton
            key={index}
            title={color.charAt(0).toUpperCase() + color.slice(1)}
            onPress={() => {
              EditorHelper.editorLastInstance &&
                EditorHelper.editorLastInstance.changeColor(color);
              EditorHelper.editorLastInstance &&
                EditorHelper.editorLastInstance.webviewRef.current?.requestFocus();
            }}
            backgroundColor={color}
          />
        ))}
      </ScrollView>
    </View>
  );
};

// @ts-ignore
const CustomButton = ({ title, onPress, backgroundColor }) => (
  <TouchableOpacity
    style={[styles.button, { backgroundColor }]}
    onPress={onPress}
  >
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    margin: 10,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});
const keyboardStyles = StyleSheet.create({
  keyboardContainer: {
    width: '100%',
    height: '100%',
  },
});

AppRegistry.registerComponent('keyboard.color', () => ColorKeyboard);

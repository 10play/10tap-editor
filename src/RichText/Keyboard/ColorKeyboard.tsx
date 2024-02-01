import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EditorHelper } from '../EditorHelper';

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
];

export const ColorKeyboard = () => {
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
                  EditorHelper.editorLastInstance.setColor(color);
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
                  EditorHelper.editorLastInstance.setHighlight(color);
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
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
});

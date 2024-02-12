import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ColorValue,
} from 'react-native';
import { EditorHelper } from '../EditorHelper';
import { CustomKeyboardExtension } from './CustomKeyboardExtension';
import { Images } from '../../assets';

const groupInThrees = (array: any[]): any[][] => {
  const result: any[][] = [];
  let tempArray: any[] = [];

  array.forEach((item, index) => {
    tempArray.push(item);

    if (tempArray.length === 3 || index === array.length - 1) {
      result.push(tempArray);
      tempArray = [];
    }
  });

  return result;
};

interface Color {
  value: ColorValue;
  name: string;
}
const textColors: Color[] = [
  {
    name: 'Default',
    value: '#000000',
  },
  {
    name: 'Red',
    value: '#EF233C',
  },
  {
    name: 'Yellow',
    value: '#FFEE32',
  },
  {
    name: 'Orange',
    value: '#FB8500',
  },
  {
    name: 'Blue',
    value: '#0085FF',
  },
  {
    name: 'Green',
    value: '#00A896',
  },
  {
    name: 'Purple',
    value: '#A463F2',
  },
  {
    name: 'Pink',
    value: '#FF5D8F',
  },
  {
    name: 'Black',
    value: '#000000',
  },
];

const highlightColors: Color[] = [
  {
    name: 'Default',
    value: '#00000026',
  },
  {
    name: 'Red',
    value: '#EF233C26',
  },
  {
    name: 'Yellow',
    value: '#FFEE3226',
  },
  {
    name: 'Orange',
    value: '#FB850026',
  },
  {
    name: 'Blue',
    value: '#0085FF26',
  },
  {
    name: 'Green',
    value: '#00A89626',
  },
  {
    name: 'Purple',
    value: '#A463F226',
  },
  {
    name: 'Pink',
    value: '#FF5D8F26',
  },
  {
    name: 'Black',
    value: '#00000026',
  },
];

const ColorKeyboardComp = () => {
  const activeColor =
    EditorHelper.editorLastInstance?.getEditorState().activeColor;
  const activeHighlight =
    EditorHelper.editorLastInstance?.getEditorState().activeHighlight;

  const setColor = (color: ColorValue) => {
    if (!EditorHelper.editorLastInstance) return;
    EditorHelper.editorLastInstance.setColor(color.toString());
    EditorHelper.editorLastInstance.focus();
  };

  const setHighlight = (color: ColorValue) => {
    if (!EditorHelper.editorLastInstance) return;
    EditorHelper.editorLastInstance.setHighlight(color.toString());
    EditorHelper.editorLastInstance.focus();
  };

  console.log({ activeColor });
  return (
    <ScrollView style={keyboardStyles.keyboardScrollView}>
      <View style={keyboardStyles.container}>
        <Text style={keyboardStyles.sectionTitle}>Color</Text>
        {groupInThrees(textColors).map((colorRow) => {
          return (
            <ColorRow
              colors={colorRow}
              onPress={setColor}
              activeColor={activeColor}
              icon
            />
          );
        })}
        <Text style={keyboardStyles.sectionTitle}>Highlight</Text>
        {groupInThrees(highlightColors).map((colorRow) => {
          return (
            <ColorRow
              colors={colorRow}
              onPress={setHighlight}
              activeColor={activeHighlight}
            />
          );
        })}
      </View>
      <View style={keyboardStyles.bottomSpacer} />
    </ScrollView>
  );
};

interface ColorRowProps {
  colors: Color[];
  onPress: (color: ColorValue) => void;
  activeColor?: string;
  icon?: boolean;
}
const ColorRow = ({ colors, onPress, activeColor, icon }: ColorRowProps) => {
  return (
    <View style={keyboardStyles.colorRow}>
      {colors.map((color) => (
        <ColorButton
          key={color.name}
          onPress={() => onPress(color.value)}
          color={color}
          isActive={color.value === activeColor}
          icon={icon}
        />
      ))}
    </View>
  );
};

interface ColorButtonProps {
  onPress: () => void;
  color: Color;
  isActive: boolean;
  icon?: boolean;
}
const ColorButton = ({ onPress, color, isActive, icon }: ColorButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      keyboardStyles.colorButton,
      isActive && keyboardStyles.activeButton,
    ]}
  >
    {icon && (
      <View style={keyboardStyles.icon}>
        <Image
          source={Images.a}
          style={[keyboardStyles.image, { tintColor: color.value }]}
          resizeMode="contain"
        />
      </View>
    )}
    {!icon && (
      <View style={[keyboardStyles.icon, { backgroundColor: color.value }]} />
    )}
    <Text style={keyboardStyles.colorText}>{color.name}</Text>
  </TouchableOpacity>
);

const keyboardStyles = StyleSheet.create({
  keyboardScrollView: {
    flex: 1,
    width: '100%',
    height: '100%',
    padding: 8,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  colorRow: {
    flexDirection: 'row',
    flex: 1,
    gap: 10,
  },
  colorButton: {
    width: 114,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#DEE0E3',
    gap: 16,
    padding: 12,
  },
  activeButton: {
    borderWidth: 1,
    borderColor: '#C8C8C9',
  },
  icon: {
    height: 20,
    width: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'solid',
    backgroundColor: 'white',
    shadowColor: '#898989',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  image: {
    height: 14,
  },
  colorText: {
    color: '#898989',
  },
  sectionTitle: {
    color: '#CACACA',
    alignSelf: 'flex-start',
    marginLeft: 30,
    fontSize: 14,
  },
  bottomSpacer: {
    height: 30,
  },
});

export const ColorKeyboard = new CustomKeyboardExtension(
  'keyboard.color',
  ColorKeyboardComp
);

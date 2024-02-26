import React, { useMemo } from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type ColorValue,
} from 'react-native';
import { EditorHelper, useRemoteEditorBridge } from '../EditorHelper';
import { CustomKeyboardExtension } from './CustomKeyboardExtension';
import { Images } from '../../assets';
import type { Color, EditorTheme } from '../../types';

const ColorKeyboardComp = () => {
  const editor = useRemoteEditorBridge();
  const activeColor = editor?.getEditorState().activeColor;
  const activeHighlight = editor?.getEditorState().activeHighlight;
  const theme = editor?.theme;
  const setColor = (color?: ColorValue) => {
    if (!EditorHelper.editorLastInstance) return;
    if (color) EditorHelper.editorLastInstance.setColor(color.toString());
    else EditorHelper.editorLastInstance.unsetColor();
    EditorHelper.editorLastInstance.focus();
  };

  const setHighlight = (color?: ColorValue) => {
    if (!EditorHelper.editorLastInstance) return;
    if (color) EditorHelper.editorLastInstance.setHighlight(color.toString());
    else EditorHelper.editorLastInstance.unsetHighlight();
    EditorHelper.editorLastInstance.focus();
  };

  const groupedTextColors = useMemo(
    () => groupInChunks(theme?.colorKeyboard.colorSelection || [], 3),
    [theme?.colorKeyboard.colorSelection]
  );
  const groupedHighlightColors = useMemo(
    () => groupInChunks(theme?.colorKeyboard.highlightSelection || [], 3),
    [theme?.colorKeyboard.highlightSelection]
  );

  return (
    <ScrollView style={theme?.colorKeyboard.scrollViewContainer}>
      <View style={theme?.colorKeyboard.keyboardContainer}>
        <Text style={theme?.colorKeyboard.sectionTitle}>Color</Text>
        {groupedTextColors.map((colorRow) => {
          return (
            <ColorRow
              theme={theme}
              colors={colorRow}
              onPress={setColor}
              activeColor={activeColor}
              key={colorRow[0]?.name}
              icon
            />
          );
        })}
        <Text style={theme?.colorKeyboard.sectionTitle}>Highlight</Text>
        {groupedHighlightColors.map((colorRow) => {
          return (
            <ColorRow
              theme={theme}
              colors={colorRow}
              onPress={setHighlight}
              activeColor={activeHighlight}
              key={colorRow[1]?.name}
            />
          );
        })}
      </View>
      <View style={theme?.colorKeyboard.bottomSpacer} />
    </ScrollView>
  );
};

interface ColorRowProps {
  colors: Color[];
  theme?: EditorTheme;
  onPress: (color?: ColorValue) => void;
  activeColor?: string;
  icon?: boolean;
}
const ColorRow = ({
  theme,
  colors,
  onPress,
  activeColor,
  icon,
}: ColorRowProps) => {
  return (
    <View style={theme?.colorKeyboard.colorRow}>
      {colors.map((color) => (
        <ColorButton
          key={color.name}
          onPress={() => onPress(color.value)}
          color={color}
          isActive={
            color.value === activeColor || (!color.value && !activeColor)
          }
          theme={theme}
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
  theme?: EditorTheme;
  icon?: boolean;
}
const ColorButton = ({
  theme,
  onPress,
  color,
  isActive,
  icon,
}: ColorButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      theme?.colorKeyboard.colorButton,
      isActive && theme?.colorKeyboard.activeButton,
    ]}
  >
    {icon && (
      <View style={theme?.colorKeyboard.iconContainer}>
        <Image
          source={Images.a}
          style={[
            theme?.colorKeyboard.textIcon,
            {
              tintColor: color.displayColor || color.value,
            },
          ]}
          resizeMode="contain"
        />
      </View>
    )}
    {!icon && (
      <View style={[theme?.colorKeyboard.iconContainer]}>
        <View
          style={[
            theme?.colorKeyboard.highlight,
            {
              backgroundColor: color.displayColor || color.value,
            },
          ]}
        />
      </View>
    )}
    <Text style={theme?.colorKeyboard.colorText}>{color.name}</Text>
  </TouchableOpacity>
);

function groupInChunks<T>(array: T[], chunkSize: number): T[][] {
  let result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

export const ColorKeyboard = new CustomKeyboardExtension(
  'keyboard.color',
  ColorKeyboardComp
);

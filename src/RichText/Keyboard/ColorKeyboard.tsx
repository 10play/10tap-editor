import React, { useMemo } from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type ColorValue,
} from 'react-native';
import { Images } from '../../assets';
import type {} from '../../bridges/color';
import type {} from '../../bridges/highlight';
import type { Color, ColorKeyboardTheme, EditorBridge } from '../../types';
import { useRemoteEditorBridge } from '../EditorHelper';
import { useBridgeState } from '../useBridgeState';
import {
  CustomKeyboardExtension,
  type CustomKeyboardComponentProps,
} from './CustomKeyboardExtension';
import { resolveColorKeyboardTheme } from './keyboardTheme';

const ColorKeyboardComp = ({
  editor: editorProp,
}: Partial<CustomKeyboardComponentProps>) => {
  const remoteEditor = useRemoteEditorBridge();
  const editor = editorProp ?? remoteEditor;
  return editor ? <ColorKeyboardPanel editor={editor} /> : null;
};

const ColorKeyboardPanel = ({ editor }: { editor: EditorBridge }) => {
  const { activeColor, activeHighlight } = useBridgeState(editor);
  const theme = resolveColorKeyboardTheme(editor.theme);

  // Focusing the editor after a pick closes back to the system keyboard.
  const setColor = (color?: ColorValue) => {
    if (color) editor.setColor(color.toString());
    else editor.unsetColor();
    editor.focus();
  };

  const setHighlight = (color?: ColorValue) => {
    if (color) editor.setHighlight(color.toString());
    else editor.unsetHighlight();
    editor.focus();
  };

  const textColorRows = useMemo(
    () => groupInChunks(theme.colorSelection, 3),
    [theme.colorSelection]
  );
  const highlightRows = useMemo(
    () => groupInChunks(theme.highlightSelection, 3),
    [theme.highlightSelection]
  );

  return (
    <ScrollView style={theme.scrollViewContainer}>
      <View style={theme.keyboardContainer}>
        <Text style={theme.sectionTitle}>Color</Text>
        {textColorRows.map((colors, index) => (
          <ColorRow
            key={index}
            theme={theme}
            colors={colors}
            onPress={setColor}
            activeColor={activeColor}
            icon
          />
        ))}
        <Text style={theme.sectionTitle}>Highlight</Text>
        {highlightRows.map((colors, index) => (
          <ColorRow
            key={index}
            theme={theme}
            colors={colors}
            onPress={setHighlight}
            activeColor={activeHighlight}
          />
        ))}
      </View>
      <View style={theme.bottomSpacer} />
    </ScrollView>
  );
};

interface ColorRowProps {
  colors: Color[];
  theme: ColorKeyboardTheme;
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
}: ColorRowProps) => (
  <View style={theme.colorRow}>
    {colors.map((color) => (
      <ColorButton
        key={color.name}
        onPress={() => onPress(color.value)}
        color={color}
        isActive={color.value === activeColor || (!color.value && !activeColor)}
        theme={theme}
        icon={icon}
      />
    ))}
  </View>
);

interface ColorButtonProps {
  onPress: () => void;
  color: Color;
  isActive: boolean;
  theme: ColorKeyboardTheme;
  icon?: boolean;
}

const ColorButton = ({
  theme,
  onPress,
  color,
  isActive,
  icon,
}: ColorButtonProps) => {
  const swatch = color.displayColor || color.value;
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      style={[theme.colorButton, isActive && theme.activeButton]}
    >
      <View style={theme.iconContainer}>
        {icon ? (
          <Image
            source={Images.a}
            style={[theme.textIcon, { tintColor: swatch }]}
            resizeMode="contain"
          />
        ) : (
          <View style={[theme.highlight, { backgroundColor: swatch }]} />
        )}
      </View>
      <Text style={theme.colorText}>{color.name}</Text>
    </TouchableOpacity>
  );
};

function groupInChunks<T>(array: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

export const ColorKeyboard = new CustomKeyboardExtension(
  'keyboard.color',
  ColorKeyboardComp
);

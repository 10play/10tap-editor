// 0.7.x keyboard theming (docs: examples/customTheme.md, colorKeyboard.md,
// api/CustomKeyboardUtils.md) and the rest of the 0.7.x keyboard surface.
import React, { type ComponentType } from 'react';
import { View, type ColorValue } from 'react-native';
import {
  ColorKeyboard,
  CustomKeyboard,
  CustomKeyboardExtension,
  TenTapView,
  darkEditorTheme,
  defaultEditorTheme,
  useEditorBridge,
  type Color,
  type ColorKeyboardTheme,
  type EditorBridge,
  type EditorTheme,
} from '@10play/tentap-editor';
import { toolbarTheme } from '../types-1.0.1/theme';
import { expectAssignable } from '../typeAssert';

export const customColors: Color[] = [
  {
    name: 'Custom Color',
    value: '#E5112B',
    displayColor: '#E5112B',
  },
  { name: 'Default' },
];

export const colorKeyboardTheme: ColorKeyboardTheme = {
  scrollViewContainer: { flex: 1 },
  keyboardContainer: { gap: 8 },
  colorRow: { flexDirection: 'row' },
  colorButton: { width: 114 },
  activeButton: { borderWidth: 1 },
  iconContainer: { height: 20 },
  textIcon: { height: 14 },
  highlight: { width: 20 },
  colorText: { color: '#898989' },
  sectionTitle: { fontSize: 14 },
  bottomSpacer: { height: 30 },
  colorSelection: customColors,
  highlightSelection: customColors,
  keyboardRootColor: '#F5F5F5',
};

export const fullKeyboardEraTheme: EditorTheme = {
  toolbar: toolbarTheme,
  colorKeyboard: colorKeyboardTheme,
  webview: { backgroundColor: '#1C1C1E' },
  webviewContainer: {},
};

export const useCustomTheme = () =>
  useEditorBridge({
    theme: {
      colorKeyboard: {
        keyboardRootColor: 'white',
        colorSelection: customColors,
      },
      webview: {
        backgroundColor: '#1C1C1E',
      },
      webviewContainer: {},
    },
  });

export const themeReads = (editor: EditorBridge) => {
  const root: ColorValue | undefined =
    editor.theme.colorKeyboard?.keyboardRootColor;
  const selections: (Color[] | undefined)[] = [
    defaultEditorTheme.colorKeyboard?.colorSelection,
    darkEditorTheme.colorKeyboard?.highlightSelection,
  ];
  return { root, selections };
};

export const extensionFields = () => {
  const id: string = ColorKeyboard.id;
  const comp: ComponentType<object> = ColorKeyboard.comp;
  const extension = new CustomKeyboardExtension('keyboard.empty', () => null);
  return {
    id,
    comp,
    extension: expectAssignable<CustomKeyboardExtension>(extension),
  };
};

// 0.7.x annotated keyboard lists with the bare, then non-generic, class.
export const keyboardList: CustomKeyboardExtension[] = [ColorKeyboard];

export const RootBackground = ({
  editor,
  rootRef,
}: {
  editor: EditorBridge;
  rootRef: React.RefObject<View | null>;
}) => (
  <>
    <CustomKeyboard
      rootRef={rootRef}
      keyboards={[ColorKeyboard]}
      activeKeyboardID={ColorKeyboard.id}
      setActiveKeyboardID={() => {}}
      rootBackground="#313132"
      editor={editor}
    />
    <TenTapView keyboardHeight={0} keyboardID={ColorKeyboard.id} />
  </>
);

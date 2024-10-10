import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';
import type {
  ArgsToolbarCB,
  ToolbarContextConfig,
  ToolbarItem,
} from '../../../src/RichText/Toolbar/ToolbarTypes';
import { TOOLBAR_SECTIONS } from '../../../src/RichText/Toolbar/actions';
import { Images } from '../../../src/assets';
import type { ToolbarContext } from '../../../src/RichText/Toolbar/Toolbar';

const colors = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#C39BD3',
  '#7DCE13',
];

// Define a custom context component that will be displayed in the toolbar
const CustomContextComponent: React.FC<ArgsToolbarCB<'CustomContext'>> = ({
  setToolbarContext,
  editor,
}) => (
  <View style={styles.colorPickerContainer}>
    <TouchableOpacity
      style={styles.closeButton}
      onPress={() => setToolbarContext('Main')}
    >
      <Image source={Images.close} style={styles.closeIcon} />
    </TouchableOpacity>
    {colors.map((color) => (
      <TouchableOpacity
        key={color}
        style={styles.colorButton}
        onPress={() => {
          editor.setColor(color);
          setToolbarContext('Main');
        }}
      >
        <View style={[styles.colorSwatch, { backgroundColor: color }]} />
      </TouchableOpacity>
    ))}
  </View>
);

export const BasicContext = ({}: NativeStackScreenProps<any, any, any>) => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent,
  });

  // Define the custom context configuration
  const customContexts: Partial<
    Record<
      ToolbarContext<'CustomContext'>,
      ToolbarContextConfig<'CustomContext'>
    >
  > = {
    CustomContext: {
      component: CustomContextComponent,
    },
  };

  // Define a custom toolbar item that switches to the CustomContext
  const customContextItem: ToolbarItem<'CustomContext'> = {
    onPress:
      ({ setToolbarContext }) =>
      () =>
        setToolbarContext('CustomContext'),
    active: () => false,
    disabled: () => false,
    image: () => Images.palette,
  };

  // Create custom toolbar sections by adding the custom item to existing sections
  const customSections = {
    customTools: {
      // Include the custom context switch item in the toolbar
      items: [customContextItem],
    },
    // Spread the existing default toolbar sections
    ...TOOLBAR_SECTIONS,
  };

  return (
    <SafeAreaView style={styles.fullScreen}>
      <RichText editor={editor} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <Toolbar
          editor={editor}
          // Add the custom context to the toolbar
          contexts={customContexts}
          // Add the custom toolbar sections
          sections={customSections}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
  colorPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderTopColor: '#DEE0E3',
    borderBottomColor: '#DEE0E3',
    height: 44,
    paddingHorizontal: 8,
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 4,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  closeIcon: {
    width: 20,
    height: 20,
    tintColor: '#898989',
  },
});

const initialContent = `<p>This is a basic example with custom context for color picking!</p>`;

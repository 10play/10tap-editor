import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
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

// Define a custom context component that will be displayed in the toolbar
const CustomContextComponent: React.FC<ArgsToolbarCB<'CustomContext'>> = ({
  setToolbarContext,
}) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 10,
    }}
  >
    <Text onPress={() => setToolbarContext('Main')}>Custom Context</Text>
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
    image: () => Images.close,
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
    <SafeAreaView style={exampleStyles.fullScreen}>
      <RichText editor={editor} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={exampleStyles.keyboardAvoidingView}
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

const exampleStyles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
});

const initialContent = `<p>This is a basic example with custom context!</p>`;

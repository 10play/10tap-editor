---
sidebar_position: 3
---

# Basic Example With Custom Context

This guide will walk you through adding a **custom context** to the toolbar in the editor. We will create a new toolbar item to switch to the custom context, define a custom section in the toolbar, and display a custom component when the context is active.

## Step 1: Setup Your Editor

First, we need to set up the **basic editor** using the `RichText` and `Toolbar` components from `@10play/tentap-editor`.

```tsx
import React from 'react';
import { SafeAreaView, KeyboardAvoidingView, StyleSheet } from 'react-native';
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';

export const Basic = () => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent,
  });

  return (
    <SafeAreaView style={styles.fullScreen}>
      <RichText editor={editor} />
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.keyboardAvoidingView}
      >
        <Toolbar editor={editor} />
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
});

const initialContent = `<p>Welcome to the basic editor!</p>`;
```

## Step 2: Create a Custom Context Component

Now We'll create a simple custom context component that allows switching back to the main toolbar context.

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import type { ArgsToolbarCB } from '@10play/tentap-editor';

// Define the custom context component
const CustomContextComponent: React.FC<ArgsToolbarCB> = ({
  setToolbarContext,
}) => (
  <View style={{ flexDirection: 'row', padding: 10 }}>
    <Text onPress={() => setToolbarContext('Main')}>
      Switch to Main Context
    </Text>
  </View>
);
```

## Step 3: Define a Custom Toolbar Item

Next, we'll create a **toolbar item** that switches to the custom context when clicked.

```tsx
import { Images } from './path to your Images'; // Import custom icon

// Toolbar item to switch to the custom context
const customContextItem = {
  onPress:
    ({ setToolbarContext }: ArgsToolbarCB) =>
    () =>
      setToolbarContext('CustomContext'),
  active: () => false, // No active state needed
  disabled: () => false, // Always enabled
  image: () => Images.customIcon, // Use an icon for the toolbar item
};
```

## Step 4: Add Custom Context and Sections to the Toolbar

Now, we'll integrate the custom context and toolbar item into the toolbar by defining custom contexts and sections.

```tsx
import { TOOLBAR_SECTIONS } from '@10play/tentap-editor'; // Import default toolbar sections

// Define custom contexts and sections
const customContexts: Record<string, ToolbarContextConfig> = {
  CustomContext: {
    component: CustomContextComponent, // Use your custom context component
  },
};

// Add your custom section to the default toolbar sections
const customSections = {
  customSection: {
    items: [customContextItem], // Include your custom toolbar item
  },
  ...TOOLBAR_SECTIONS, // Merge with default sections
};
```

## Step 5: Update the Editor with Custom Toolbar

Finally, we will add the custom contexts and sections to the toolbar, and integrate everything into the editor.

```tsx
export const Basic = () => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent,
  });

  return (
    <SafeAreaView style={styles.fullScreen}>
      <RichText editor={editor} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <Toolbar
          editor={editor}
          contexts={customContexts} // Pass your custom context
          sections={customSections} // Pass your custom sections
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
```

## Full Example

```tsx
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
} from '../../../src/RichText/Toolbar/ToolbarTypes';
import { TOOLBAR_SECTIONS } from '../../../src/RichText/Toolbar/actions';
import { Images } from '../../../src/assets';

// Define a custom context component that will be displayed in the toolbar
const CustomContextComponent: React.FC<ArgsToolbarCB> = ({
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
export const Basic = ({}: NativeStackScreenProps<any, any, any>) => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent,
  });

  // Define the custom context configuration
  const customContexts: Record<string, ToolbarContextConfig> = {
    CustomContext: {
      // Use the custom context component defined above
      component: CustomContextComponent,
    },
  };

  // Define a custom toolbar item that switches to the CustomContext
  const customContextItem = {
    onPress:
      ({ setToolbarContext }: ArgsToolbarCB) =>
      () =>
        setToolbarContext('CustomContext'),
    active: () => false,
    disabled: () => false,
    image: () => Images.close,
  };

  // Create custom toolbar sections by adding the custom item to existing sections
  const customSections = {
    customSection: {
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
```

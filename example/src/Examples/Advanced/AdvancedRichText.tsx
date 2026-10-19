import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  RichText,
  useEditorBridge,
  useBridgeState,
  type EditorBridge,
  TenTapStartKit,
} from '@10play/tentap-editor';

import { editorHtml } from './editor-web/build/editorHtml';
import { CounterBridge } from './CounterBridge';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { layoutStyles } from '../../ui/styles';
import { radii, spacing, type, useTheme } from '../../ui/theme';

const Counter = ({ editor }: { editor: EditorBridge }) => {
  const state = useBridgeState(editor);
  const { colors } = useTheme();
  return (
    <View
      style={[exampleStyles.counter, { backgroundColor: colors.accentSoft }]}
    >
      <Text style={[exampleStyles.counterText, { color: colors.accent }]}>
        {state.wordCount} || {state.characterCount}
      </Text>
    </View>
  );
};

export const Advanced = (_props: NativeStackScreenProps<any, any, any>) => {
  const editor = useEditorBridge({
    customSource: editorHtml,
    bridgeExtensions: [...TenTapStartKit, CounterBridge],
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent: `<p>This is a basic example of implementing images.</p><img src="https://source.unsplash.com/8xznAGy4HcY/800x400" /><p>s sdfdsf fd dsfd ssdfd dsfdsfdsfdsfd</p>`,
  });
  const TapRef = useRef(null);

  return (
    <SafeAreaView style={layoutStyles.fullScreen} ref={TapRef}>
      <ScreenHeader right={<Counter editor={editor} />} />
      <View style={layoutStyles.paper}>
        <RichText editor={editor} />
      </View>
    </SafeAreaView>
  );
};

const exampleStyles = StyleSheet.create({
  counter: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  counterText: {
    ...type.caption,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});

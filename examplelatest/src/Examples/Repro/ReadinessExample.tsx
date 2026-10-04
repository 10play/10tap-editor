import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RichText, useEditorBridge } from '@10play/tentap-editor';
import { EditorProbe } from './EditorProbe';

/**
 * A read-only editor with no autofocus. It must still report ready and show
 * its content without any user interaction (#343, #322, #227).
 */
export const ReadinessExample = () => {
  const editor = useEditorBridge({
    editable: false,
    initialContent: '<p>Read-only content loaded</p>',
  });

  return (
    <SafeAreaView style={styles.fullScreen}>
      <EditorProbe editor={editor} />
      <View style={styles.fullScreen}>
        <RichText editor={editor} testID="readiness-editor" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
});

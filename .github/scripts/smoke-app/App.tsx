import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';

// Installed into freshly generated apps by rn-smoke.sh and expo-smoke.sh.
export default function App() {
  const editor = useEditorBridge({
    autofocus: true,
    initialContent: '<p>Smoke test</p>',
  });
  return (
    <SafeAreaView style={styles.fullScreen}>
      <RichText editor={editor} />
      <Toolbar editor={editor} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
});

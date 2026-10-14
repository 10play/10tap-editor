import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  RichText,
  Toolbar,
  useBridgeState,
  useEditorBridge,
  type EditorBridge,
} from '@10play/tentap-editor';

const longContent = Array.from(
  { length: 15 },
  (_, i) => `<p>Line ${i + 1}</p>`
).join('');

const Button = ({
  label,
  testID,
  onPress,
}: {
  label: string;
  testID: string;
  onPress: () => void;
}) => (
  <Pressable testID={testID} onPress={onPress} style={styles.button}>
    <Text>{label}</Text>
  </Pressable>
);

const EditorState = ({
  editor,
  testID,
}: {
  editor: EditorBridge;
  testID: string;
}) => {
  const { isReady, isFocused, isBoldActive } = useBridgeState(editor);
  return (
    <Text testID={testID}>
      {`ready:${isReady} focused:${isFocused} bold:${isBoldActive}`}
    </Text>
  );
};

/** One of two editors on the same page; each must only see its own messages (#318). */
const EditorPanel = ({ id, content }: { id: string; content: string }) => {
  const editor = useEditorBridge({ initialContent: content });
  const [html, setHtml] = useState('');
  return (
    <View style={styles.panel}>
      <EditorState editor={editor} testID={`${id}-state`} />
      <Button
        label="Read HTML"
        testID={`${id}-read`}
        onPress={async () => setHtml(await editor.getHTML())}
      />
      <Text testID={`${id}-html`}>{html}</Text>
      <View style={styles.editor} testID={`${id}-editor`}>
        <RichText editor={editor} />
      </View>
    </View>
  );
};

const TwoEditors = () => (
  <View style={styles.row}>
    <EditorPanel id="first" content="<p>Alpha</p>" />
    <EditorPanel id="second" content="<p>Bravo</p>" />
  </View>
);

/** A `dynamicHeight` editor must resize its iframe on web too (#205). */
const DynamicHeight = () => {
  const editor = useEditorBridge({
    dynamicHeight: true,
    initialContent: '<p>One line</p>',
  });
  return (
    <View style={styles.panel}>
      <EditorState editor={editor} testID="dynamic-state" />
      <Button
        label="Grow"
        testID="grow"
        onPress={() => editor.setContent(longContent)}
      />
      <View testID="dynamic-frame" style={styles.frame}>
        <RichText editor={editor} />
      </View>
    </View>
  );
};

/** Capped by its parent's `maxHeight`, the editor shrinks to it and scrolls (#289, #323). */
const CappedDynamicHeight = () => {
  const editor = useEditorBridge({
    dynamicHeight: true,
    initialContent: longContent,
  });
  return (
    <View style={styles.panel}>
      <EditorState editor={editor} testID="capped-state" />
      <View testID="capped-frame" style={[styles.frame, styles.capped]}>
        <RichText editor={editor} />
      </View>
    </View>
  );
};

/**
 * The Toolbar straight in a column above the editor, as the Expo web docs
 * place it: it must not overflow a phone-width window, the link bar must not
 * grow down the column, and toolbar presses must leave the editor focused.
 */
const ToolbarScenario = () => {
  const editor = useEditorBridge({
    initialContent: '<p>Hello toolbar</p>',
  });
  return (
    <View style={styles.column}>
      <EditorState editor={editor} testID="toolbar-state" />
      <Toolbar editor={editor} />
      <View style={styles.editor} testID="toolbar-editor">
        <RichText editor={editor} />
      </View>
    </View>
  );
};

const scenarios = {
  'toolbar': ToolbarScenario,
  'two-editors': TwoEditors,
  'dynamic-height': DynamicHeight,
  'capped-dynamic-height': CappedDynamicHeight,
};

const isScenario = (name: string | null): name is keyof typeof scenarios =>
  name !== null && name in scenarios;

const App = () => {
  const name = new URLSearchParams(window.location.search).get('scenario');
  if (!isScenario(name)) {
    return <Text>{`Unknown scenario: ${name}`}</Text>;
  }
  const Scenario = scenarios[name];
  return <Scenario />;
};

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  column: {
    flex: 1,
  },
  panel: {
    flex: 1,
    padding: 8,
    gap: 6,
  },
  editor: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#c4c4c4',
  },
  frame: {
    borderWidth: 1,
    borderColor: '#c4c4c4',
  },
  capped: {
    maxHeight: 150,
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#dcdcdc',
  },
});

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}

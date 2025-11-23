import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  Button,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CodeBridge,
  CoreBridge,
  RichText,
  TenTapStartKit,
  Toolbar,
  useEditorBridge,
} from '@10play/tentap-editor';
import { ProtestRiotFont } from './CustomFont';

const customFont = `
${ProtestRiotFont}
* {
    font-family: 'Protest Riot', sans-serif;
}
`;

const customCodeBlockCSS = `
code {
    background-color: #ffdede;
    border-radius: 0.25em;
    border-color: #e45d5d;
    border-width: 1px;
    border-style: solid;
    box-decoration-break: clone;
    color: #cd4242;
    font-size: 0.9rem;
    padding: 0.25em;
}
`;

export const CustomCss = ({}: NativeStackScreenProps<any, any, any>) => {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent,
    bridgeExtensions: [
      ...TenTapStartKit,
      CoreBridge.configureCSS(customFont), // Custom font
      CodeBridge.configureCSS(customCodeBlockCSS), // Custom codeblock css
    ],
  });

  return (
    <SafeAreaView style={exampleStyles.fullScreen}>
      <Button
        title={'Random CodeBlock Color'}
        onPress={() => {
          editor.injectCSS(
            `
            code {
              background-color: ${
                '#' + Math.floor(Math.random() * 16777215).toString(16)
              };
              border-radius: 0.25em;
              border-color: ${
                '#' + Math.floor(Math.random() * 16777215).toString(16)
              };
              border-width: 1px;
              border-style: solid;
              box-decoration-break: clone;
              color: ${'#' + Math.floor(Math.random() * 16777215).toString(16)};
              font-size: 0.9rem;
              padding: 0.25em;
          }
          `,
            // Because we are passing CodeBridge name here, the existing css from CodeBridge will be replaced
            // With the css we are injecting here
            CodeBridge.name
          );
        }}
      />
      <Button
        title={'Random Font Size'}
        onPress={() => {
          editor.injectCSS(
            `
            * {
              font-size: ${Math.random() * 60}px;
            }
          `,
            // We are passing a custom tag here, so no bridge css will be replaced, instead a new stylesheet with be created with
            // the tag 'font-size', and it will only be replaced with we injectCSS again with the same tag
            'font-size'
          );
        }}
      />
      <RichText editor={editor} />
      <KeyboardAvoidingView
        behavior={'padding'}
        style={exampleStyles.keyboardAvoidingView}
      >
        <Toolbar editor={editor} />
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

const initialContent = `<p>Custom Font And CSS!</p></br><code>Custom Code Block</code></br><p></p>`;

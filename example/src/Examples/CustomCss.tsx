import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { KeyboardAvoidingView, View } from 'react-native';
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
import { Chip } from '../ui/Chip';
import { ScreenHeader } from '../ui/ScreenHeader';
import { layoutStyles } from '../ui/styles';

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

export const CustomCss = (_props: NativeStackScreenProps<any, any, any>) => {
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
    <SafeAreaView style={layoutStyles.fullScreen}>
      <ScreenHeader />
      <View style={layoutStyles.actions}>
        <Chip
          label="Random CodeBlock Color"
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
        <Chip
          label="Random Font Size"
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
      </View>
      <View style={layoutStyles.paper}>
        <RichText editor={editor} />
      </View>
      <KeyboardAvoidingView
        behavior={'padding'}
        style={layoutStyles.keyboardAvoidingView}
      >
        <Toolbar editor={editor} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const initialContent = `<p>Custom Font And CSS!</p></br><code>Custom Code Block</code></br><p></p>`;

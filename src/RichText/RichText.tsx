import React from 'react';
import { StyleSheet } from 'react-native';
import {
  WebView,
  type WebViewProps,
  type WebViewMessageEvent,
} from 'react-native-webview';

// @ts-ignore
import editorHTML from '../Editor/build/index.html';

import { type EditorMessage, EditorMessageType } from '../types/Messaging';
import { type Editor } from './useEditor';

interface RichTextProps extends WebViewProps {
  editor: Editor;
  DEV?: boolean;
}

const DEV_SERVER_URL = 'http://localhost:3000';

export const RichText = (props: RichTextProps) => {
  const { DEV, editor } = props;
  const source: WebViewProps['source'] = DEV
    ? { uri: DEV_SERVER_URL }
    : { html: editorHTML };

  const onWebviewMessage = (event: WebViewMessageEvent) => {
    const { data } = event.nativeEvent;
    // Parse the message sent from the editor
    const { type, payload } = JSON.parse(data) as EditorMessage;
    switch (type) {
      case EditorMessageType.StateUpdate:
        editor._updateEditorState(payload);
        break;
    }
  };

  return (
    <WebView
      style={RichTextStyles.fullScreen}
      source={source}
      hideKeyboardAccessoryView={true}
      onMessage={onWebviewMessage}
      ref={props.editor.webviewRef}
      webviewDebuggingEnabled={__DEV__}
      {...props}
    />
  );
};

const RichTextStyles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
});

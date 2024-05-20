import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, TextInput } from 'react-native';
import {
  WebView,
  type WebViewProps,
  type WebViewMessageEvent,
} from 'react-native-webview';

import { editorHtml } from '../simpleWebEditor/build/editorHtml';

import { type EditorMessage } from '../types/Messaging';
import { useKeyboard } from '../utils';
import type { EditorBridge } from '../types';
import { getInjectedJS } from './utils';
import { isFabric } from '../utils/misc';

interface RichTextProps extends WebViewProps {
  editor: EditorBridge;
}

const styles = StyleSheet.create({
  hiddenInput: {
    display: 'none',
    width: 0,
    height: 0,
    position: 'absolute',
    flex: 1,
    top: 0,
    left: 0,
  },
});

const DEV_SERVER_URL = 'http://localhost:3000';

// TODO: make it a prop
const TOOLBAR_HEIGHT = 44;

export const RichText = ({ editor, ...props }: RichTextProps) => {
  const [loaded, setLoaded] = useState(isFabric());
  const { keyboardHeight: iosKeyboardHeight, isKeyboardUp } = useKeyboard();
  const source: WebViewProps['source'] = editor.DEV
    ? { uri: editor.DEV_SERVER_URL || DEV_SERVER_URL }
    : {
        html: editor.customSource || editorHtml,
        baseUrl: editor.webviewBaseURL,
      };

  const onWebviewMessage = (event: WebViewMessageEvent) => {
    const { data } = event.nativeEvent;
    // Parse the message sent from the editor
    const { type, payload } = JSON.parse(data) as EditorMessage;
    editor.bridgeExtensions?.forEach((e) => {
      e.onEditorMessage && e.onEditorMessage({ type, payload }, editor);
    });
  };

  useEffect(() => {
    const setDocBottomPadding = (height: number) => {
      if (editor.webviewRef.current) {
        editor.webviewRef.current.injectJavaScript(`
          doc = document.querySelector('.ProseMirror');
          if(doc) doc.style.paddingBottom = '${height}px';
        `);
      }
    };
    if (editor.webviewRef.current && Platform.OS === 'android') {
      if (iosKeyboardHeight && isKeyboardUp) {
        setTimeout(() => {
          setDocBottomPadding(TOOLBAR_HEIGHT);
          editor.updateScrollThresholdAndMargin(TOOLBAR_HEIGHT);
        }, 200);
      } else {
        setTimeout(() => {
          setDocBottomPadding(0);
          editor.updateScrollThresholdAndMargin(0);
        }, 200);
      }
    }
    // On iOS we want to control the scroll and not use the scrollview that comes with react-native-webview
    // That's way we can get better exp on scroll and scroll to element when we need to
    if (
      editor.avoidIosKeyboard &&
      editor.webviewRef.current &&
      Platform.OS === 'ios'
    ) {
      if (iosKeyboardHeight) {
        setDocBottomPadding(iosKeyboardHeight + 10);
        editor.updateScrollThresholdAndMargin(iosKeyboardHeight + 10);
      } else {
        setDocBottomPadding(0);
        editor.updateScrollThresholdAndMargin(0);
      }
    }
  }, [editor.avoidIosKeyboard, editor, iosKeyboardHeight, isKeyboardUp]);

  const injectedJavaScript = useMemo(
    () => getInjectedJS(editor.bridgeExtensions || []),
    [editor.bridgeExtensions]
  );

  return (
    <>
      {editor.autofocus && Platform.OS === 'android' && (
        <TextInput autoFocus style={styles.hiddenInput} />
      )}
      <WebView
        scrollEnabled={false}
        style={[
          RichTextStyles.fullScreen,
          { display: loaded ? 'flex' : 'none' },
          editor.theme.webview,
        ]}
        containerStyle={editor.theme.webviewContainer}
        source={source}
        injectedJavaScript={injectedJavaScript}
        injectedJavaScriptBeforeContentLoaded={`${
          editor.bridgeExtensions
            ? `
            window.bridgeExtensionConfigMap = '${JSON.stringify(
              editor.bridgeExtensions.reduce((acc, bridge) => {
                return {
                  ...acc,
                  [bridge.name]: {
                    optionsConfig: bridge.config,
                    extendConfig: bridge.extendConfig,
                  },
                };
              }, {})
            )}';

            window.whiteListBridgeExtensions = [${editor.bridgeExtensions
              .map((bridgeExtension) => `'${bridgeExtension.name}'`)
              .join(',')}];
                `
            : ''
        }${
          editor.initialContent
            ? `window.initialContent = '${editor.initialContent}';`
            : ''
        }
          window.editable = ${editor.editable};
        `}
        hideKeyboardAccessoryView={true}
        onMessage={onWebviewMessage}
        ref={editor.webviewRef}
        webviewDebuggingEnabled={__DEV__}
        keyboardDisplayRequiresUserAction={false}
        {...props}
        // Propagated Props
        onLoad={(e) => {
          setLoaded(true);
          props.onLoad && props.onLoad(e);
        }}
      />
    </>
  );
};

const RichTextStyles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
});

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef } from 'react';
import {
  SafeAreaView,
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import {
  RichText,
  Toolbar,
  useEditorBridge,
  CustomKeyboard,
  ColorKeyboard,
} from '@10play/tentap-editor';
import WebView from 'react-native-webview';

const exampleStyles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
  messageBox: {
    minHeight: 70,
    padding: 3,
    backgroundColor: '#828282',
    margin: 5,
    borderRadius: 3,
    maxWidth: '70%',
  },
  editorWrapper: {
    height: 70,
    paddingLeft: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
  },
  sendButton: {
    // backgroundColor: 'red',
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const defaultMessages = [{ text: 'Hello World!', date: Date.now() }];

export const EditorStickToKeyboardExample = ({}: NativeStackScreenProps<
  any,
  any,
  any
>) => {
  const editor = useEditorBridge({
    autofocus: true,
    DEV: true,
    initialContent: '<p>Initial lovely message...</p>',
  });
  const MessagesScrollViewRef = useRef<ScrollView>(null);
  const TapRef = useRef(null);
  const [messages, setMessages] =
    React.useState<{ text: string; date: number }[]>(defaultMessages);
  const [activeKeyboard, setActiveKeyboard] = React.useState<string>();

  const onSendMessage = async () => {
    const content = await editor.getContent();
    setMessages((prev) => [...prev, { text: content, date: Date.now() }]);
    editor.setContent('');
    if (MessagesScrollViewRef.current) {
      setTimeout(() => {
        MessagesScrollViewRef.current!.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <SafeAreaView style={exampleStyles.fullScreen} ref={TapRef}>
      <ScrollView
        automaticallyAdjustKeyboardInsets={true}
        ref={MessagesScrollViewRef}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {messages.map((message) => (
          <View style={exampleStyles.messageBox}>
            <WebView
              source={{
                html: `<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${message.text}</body></html>`,
              }}
            />
          </View>
        ))}
      </ScrollView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={exampleStyles.keyboardAvoidingView}
      >
        <View style={exampleStyles.editorWrapper}>
          <RichText editor={editor} />
          <TouchableOpacity
            style={exampleStyles.sendButton}
            onPress={onSendMessage}
          >
            <Text>{'>'}</Text>
          </TouchableOpacity>
        </View>
        <Toolbar
          activeKeyboard={activeKeyboard}
          setActiveKeyboard={setActiveKeyboard}
          editor={editor}
          hidden={false}
        />
        <CustomKeyboard
          rootRef={TapRef}
          keyboards={[ColorKeyboard]}
          activeKeyboardID={activeKeyboard}
          setActiveKeyboardID={setActiveKeyboard}
          editor={editor}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

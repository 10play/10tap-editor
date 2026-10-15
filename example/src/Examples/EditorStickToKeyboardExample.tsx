import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef } from 'react';
import {
  View,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';
import WebView from 'react-native-webview';
import { Icon } from './Icon';
import { ScreenHeader } from '../ui/ScreenHeader';
import { layoutStyles } from '../ui/styles';
import { paper, radii, spacing, useTheme } from '../ui/theme';

const messageHtml = (text: string, color: string) =>
  `<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{margin:0;background:transparent;color:${color};font:16px -apple-system,Roboto,sans-serif}p{margin:0}</style></head><body>${text}</body></html>`;

const defaultMessages = [{ text: 'Hello World!', date: Date.now() }];

export const EditorStickToKeyboardExample = (
  _props: NativeStackScreenProps<any, any, any>
) => {
  const editor = useEditorBridge({
    autofocus: true,
    initialContent: '<p>Initial lovely message...</p>',
  });
  const MessagesScrollViewRef = useRef<ScrollView>(null);
  const TapRef = useRef(null);
  const { colors } = useTheme();
  const [messages, setMessages] =
    React.useState<{ text: string; date: number }[]>(defaultMessages);

  const onSendMessage = async () => {
    const content = await editor.getHTML();
    setMessages((prev) => [...prev, { text: content, date: Date.now() }]);
    editor.setContent('');
    if (MessagesScrollViewRef.current) {
      setTimeout(() => {
        MessagesScrollViewRef.current!.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <SafeAreaView style={layoutStyles.fullScreen} ref={TapRef}>
      <ScreenHeader />
      <ScrollView
        automaticallyAdjustKeyboardInsets={true}
        ref={MessagesScrollViewRef}
        contentContainerStyle={exampleStyles.messages}
      >
        {messages.map((message) => (
          <View
            key={message.date}
            style={[
              exampleStyles.messageBox,
              { backgroundColor: colors.accentFill },
            ]}
          >
            <WebView
              style={exampleStyles.messageWebView}
              source={{ html: messageHtml(message.text, colors.accentText) }}
            />
          </View>
        ))}
      </ScrollView>
      <KeyboardAvoidingView
        behavior={'padding'}
        style={layoutStyles.keyboardAvoidingView}
      >
        <View style={exampleStyles.editorWrapper}>
          <View style={exampleStyles.composer}>
            <RichText editor={editor} />
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Send"
            style={[
              exampleStyles.sendButton,
              { backgroundColor: colors.accentFill },
            ]}
            onPress={onSendMessage}
          >
            <Icon name="send" fill={colors.accentText} width={20} height={20} />
          </TouchableOpacity>
        </View>
        <Toolbar editor={editor} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const exampleStyles = StyleSheet.create({
  messages: {
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: 140,
  },
  messageBox: {
    width: '70%',
    height: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderBottomRightRadius: radii.sm / 2,
  },
  messageWebView: {
    backgroundColor: 'transparent',
  },
  editorWrapper: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: paper.bar,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: paper.border,
  },
  composer: {
    flex: 1,
    alignSelf: 'stretch',
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: paper.border,
    backgroundColor: paper.background,
    overflow: 'hidden',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

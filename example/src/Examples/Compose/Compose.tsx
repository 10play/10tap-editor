import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
} from 'react-native';
import {
  ColorBridge,
  CoreBridge,
  HighlightBridge,
  ImageBridge,
  LinkBridge,
  TaskListBridge,
  TenTapStartKit,
  UnderlineBridge,
  useNativeEditor,
} from 'tentap';
import { Icon } from '../Icon';
import { ComposeRichText } from './ComposeRichText';

export const Compose = ({
  navigation,
}: NativeStackScreenProps<any, any, any>) => {
  const editor = useNativeEditor({
    initialContent: MAIL_INITIAL_CONTENT,
    plugins: [
      CoreBridge,
      TenTapStartKit,
      UnderlineBridge,
      ImageBridge,
      TaskListBridge,
      LinkBridge.configure({ openOnClick: false }),
      ColorBridge,
      HighlightBridge,
    ],
  });

  const onSendClick = async () => {
    const mailContent = await editor.getContent();
    console.log('Send Clicked! Mail content: ', mailContent);
  };

  return (
    <SafeAreaView style={[exampleStyles.fullScreen]}>
      <View style={exampleStyles.header}>
        <View style={exampleStyles.topBar}>
          <TouchableOpacity onPress={navigation.goBack}>
            <Icon name="close" fill="#5F6368" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onSendClick}>
            <Icon name="send" fill="#5F6368" />
          </TouchableOpacity>
        </View>
        <View style={exampleStyles.recipientArea}>
          <View style={exampleStyles.recipientField}>
            <Text style={exampleStyles.textSecondary}>To</Text>
            <TextInput
              style={exampleStyles.textPrimary}
              autoFocus
              placeholder="tentap@10play.dev"
            />
          </View>
          <View style={exampleStyles.recipientField}>
            <Text style={exampleStyles.textSecondary}>From</Text>
            <TextInput
              style={exampleStyles.textPrimary}
              placeholder="you@10play.dev"
            />
          </View>
          <TextInput
            style={[exampleStyles.textPrimary, exampleStyles.recipientField]}
            placeholder="Subject"
          />
        </View>
      </View>
      <ComposeRichText editor={editor} onSendClick={onSendClick} />
    </SafeAreaView>
  );
};

const exampleStyles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingHorizontal: 14,
    backgroundColor: 'white',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
    marginBottom: 10,
  },
  recipientArea: {
    gap: 8,
  },
  recipientField: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgrey',
  },
  textPrimary: {
    fontSize: 16,
  },
  textSecondary: {
    fontSize: 14,
    color: 'grey',
  },
});

const MAIL_INITIAL_CONTENT = `<p><br><br><br><br><a target="_blank" rel="noopener noreferrer nofollow" href="https://www.10play.dev">Sent With Tentap!</a></p>`;

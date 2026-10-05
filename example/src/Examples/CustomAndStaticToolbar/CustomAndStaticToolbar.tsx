import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useEditorBridge,
  useBridgeState,
  type EditorBridge,
} from '@10play/tentap-editor';
import { Icon } from '../Icon';
import { ComposeRichText } from './CustomRichText';

export const CustomAndStaticToolbar = ({
  navigation,
}: NativeStackScreenProps<any, any, any>) => {
  const editor = useEditorBridge({
    avoidIosKeyboard: true,
    initialContent: MAIL_INITIAL_CONTENT,
  });

  const onSendClick = async () => {
    const mailContent = await editor.getHTML();
    Alert.alert('Mail Content', mailContent);
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
          <StaticToolbar editor={editor} />
        </View>
      </View>
      <ComposeRichText editor={editor} onSendClick={onSendClick} />
    </SafeAreaView>
  );
};

interface StaticToolbarProps {
  editor: EditorBridge;
}
const StaticToolbar = ({ editor }: StaticToolbarProps) => {
  const editorState = useBridgeState(editor);
  return (
    <View style={[exampleStyles.recipientField, exampleStyles.staticToolbar]}>
      <TouchableOpacity onPress={editor.undo} disabled={!editorState.canUndo}>
        <Icon
          name={'undo'}
          fill={editorState.canUndo ? 'black' : 'lightgray'}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={editor.redo} disabled={!editorState.canRedo}>
        <Icon
          name={'redo'}
          fill={editorState.canRedo ? 'black' : 'lightgray'}
        />
      </TouchableOpacity>
    </View>
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
  staticToolbar: {
    justifyContent: 'flex-end',
  },
});

const MAIL_INITIAL_CONTENT = `<p><br><br><br><br><a target="_blank" rel="noopener noreferrer nofollow" href="https://www.10play.dev">Sent With Tentap!</a></p>`;

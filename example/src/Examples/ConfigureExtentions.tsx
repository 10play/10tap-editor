import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  LinkBridge,
  PlaceholderBridge,
  RichText,
  TenTapStartKit,
  useEditorBridge,
  DropCursorBridge,
} from '@10play/tentap-editor';
import { Chip } from '../ui/Chip';
import { ScreenHeader } from '../ui/ScreenHeader';
import { layoutStyles } from '../ui/styles';

export const ConfigureExtensions = () => {
  const [hideContent, setHideContent] = React.useState(false);
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    bridgeExtensions: [
      ...TenTapStartKit,
      PlaceholderBridge.configureExtension({
        placeholder: 'Hey there! Start typing...',
      }),
      LinkBridge.configureExtension({ openOnClick: false }),
      DropCursorBridge.configureExtension({
        color: '#84affe',
        width: 2,
      }),
    ],
  });

  return (
    <SafeAreaView style={layoutStyles.fullScreen}>
      <ScreenHeader />
      <View style={layoutStyles.actions}>
        <Chip
          label="Toggle Content"
          onPress={() => {
            editor.setContent(
              hideContent
                ? ''
                : `<a href="https://10play.github.io/10tap-editor">Link To TenTap!</a>
            <p>Try to drag around the image. While you drag, the editor should show a decoration under your cursor. The so called dropcursor.</p></br>
            <img src="https://source.unsplash.com/8xznAGy4HcY/800x400" /></br>
            <p>Drag Me Here</p></br></br></br></br></br><p>Or Here</p>`
            );
            setHideContent(!hideContent);
          }}
        />
        <Chip
          label="Change Placeholder"
          onPress={() => {
            editor.setPlaceholder(
              `New PLACEHOLDER at: ${new Date().toISOString()}`
            );
            setHideContent(!hideContent);
          }}
        />
      </View>
      <View style={layoutStyles.paper}>
        <RichText editor={editor} />
      </View>
    </SafeAreaView>
  );
};

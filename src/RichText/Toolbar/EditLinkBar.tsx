import React from 'react';
import { View, TextInput, TouchableOpacity, Text, Image } from 'react-native';
import { Images } from '../../assets';
import type { EditorTheme } from '../../types';

interface EditLinkBarProps {
  theme: EditorTheme;
  onBlur: () => void;
  onEditLink: (newLink: string) => void;
  onLinkIconClick: () => void;
  initialLink: string | undefined;
  hintText?: string;
}


export const EditLinkBar = ({
  theme,
  initialLink,
  onEditLink,
  onLinkIconClick,
  onBlur,
}: EditLinkBarProps) => {
  const [link, setLink] = React.useState(initialLink || '');
  return (
    <View style={theme.toolbar.linkBarTheme.addLinkContainer}>
      <TouchableOpacity
        onPress={onLinkIconClick}
        style={[
          theme.toolbar.toolbarButton,
          theme.toolbar.linkBarTheme.linkToolbarButton,
        ]}
      >
        <View
          style={[theme.toolbar.iconWrapper, theme.toolbar.iconWrapperActive]}
        >
          <Image
            source={Images.link}
            style={[theme.toolbar.icon, theme.toolbar.iconActive]}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>
      <TextInput
        value={link}
        onBlur={onBlur}
        onChangeText={setLink}
        placeholder="Type your URL here..."
        placeholderTextColor={theme.toolbar.linkBarTheme.placeholderTextColor}
        autoFocus
        style={theme.toolbar.linkBarTheme.linkInput}
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={theme.toolbar.linkBarTheme.doneButton}
        onPress={() => {
          onEditLink(link);
        }}
      >
        <Text style={theme.toolbar.linkBarTheme.doneButtonText}>{hintText || "Insert"}</Text>
      </TouchableOpacity>
    </View>
  );
};

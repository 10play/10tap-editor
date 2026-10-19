import React, { useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Image } from 'react-native';
import { Images } from '../../assets';
import type { EditorTheme, LinkBarTheme } from '../../types';

const DEFAULT_HINT_TEXT = 'Type your URL here...';

interface EditLinkBarProps {
  theme: EditorTheme;
  onBlur?: () => void;
  onEditLink: (newLink: string) => void;
  onLinkIconClick: () => void;
  initialLink: string | undefined;
}

// `hintText` (PR #239) is read optionally so themes typed before it still apply.
const getHintText = (linkBarTheme: LinkBarTheme & { hintText?: string }) =>
  linkBarTheme.hintText ?? DEFAULT_HINT_TEXT;

export const EditLinkBar = ({
  theme,
  initialLink,
  onEditLink,
  onLinkIconClick,
  onBlur,
}: EditLinkBarProps) => {
  const [link, setLink] = useState(initialLink || '');
  const { linkBarTheme } = theme.toolbar;

  useEffect(() => {
    setLink(initialLink || '');
  }, [initialLink]);

  const submit = () => onEditLink(link);

  return (
    <View style={linkBarTheme.addLinkContainer}>
      <TouchableOpacity
        onPress={onLinkIconClick}
        style={[theme.toolbar.toolbarButton, linkBarTheme.linkToolbarButton]}
        accessibilityRole="button"
        accessibilityLabel="Close link"
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
        onSubmitEditing={submit}
        placeholder={getHintText(linkBarTheme)}
        placeholderTextColor={linkBarTheme.placeholderTextColor}
        autoFocus
        style={linkBarTheme.linkInput}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        returnKeyType="done"
      />
      <TouchableOpacity
        style={linkBarTheme.doneButton}
        onPress={submit}
        accessibilityRole="button"
      >
        <Text style={linkBarTheme.doneButtonText}>Insert</Text>
      </TouchableOpacity>
    </View>
  );
};

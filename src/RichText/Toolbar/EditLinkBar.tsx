import React from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

const toolbarStyles = StyleSheet.create({
  addLinkContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  linkInput: {
    paddingLeft: 12,
    paddingRight: 12,
    flex: 1,
  },
});

interface EditLinkBarProps {
  onBlur: () => void;
  onEditLink: (newLink: string) => void;
  initialLink: string | undefined;
}

export const EditLinkBar = ({
  onEditLink,
  initialLink,
  onBlur,
}: EditLinkBarProps) => {
  const [link, setLink] = React.useState(initialLink || '');
  return (
    <View style={toolbarStyles.addLinkContainer}>
      <TextInput
        value={link}
        onBlur={onBlur}
        onChangeText={setLink}
        placeholder="Insert a link..."
        autoFocus
        style={toolbarStyles.linkInput}
      />
      <Button
        title="DONE"
        onPress={() => {
          onEditLink(link);
        }}
      />
    </View>
  );
};

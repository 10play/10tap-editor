import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';

const toolbarStyles = StyleSheet.create({
  addLinkContainer: {
    flex: 1,
    flexDirection: 'row',

    height: 40,
  },
  linkInput: {
    paddingLeft: 12,
    paddingTop: 1,
    paddingBottom: 1,
    paddingRight: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flex: 1,
  },
  doneButton: {
    backgroundColor: '#e7eefc',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: '#376eab',
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
      <TouchableOpacity
        style={toolbarStyles.doneButton}
        onPress={() => {
          onEditLink(link);
        }}
      >
        <Text style={toolbarStyles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

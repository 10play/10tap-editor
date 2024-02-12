import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Image,
} from 'react-native';
import { toolbarStyles } from './Toolbar';
import { Images } from '../../assets';

const linkBarStyles = StyleSheet.create({
  addLinkContainer: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkInput: {
    paddingLeft: 12,
    paddingTop: 1,
    paddingBottom: 1,
    paddingRight: 12,
    flex: 1,
  },
  doneButton: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    height: 32,
    padding: 8,
    borderRadius: 4,
  },
  doneButtonText: {
    color: '#0085FF',
  },
  linkToolbarButton: {
    paddingHorizontal: 0,
  },
});

interface EditLinkBarProps {
  onBlur: () => void;
  onEditLink: (newLink: string) => void;
  onLinkIconClick: () => void;
  initialLink: string | undefined;
}

export const EditLinkBar = ({
  initialLink,
  onEditLink,
  onLinkIconClick,
  onBlur,
}: EditLinkBarProps) => {
  const [link, setLink] = React.useState(initialLink || '');
  return (
    <View style={linkBarStyles.addLinkContainer}>
      <TouchableOpacity
        onPress={onLinkIconClick}
        style={[toolbarStyles.toolbarButton, linkBarStyles.linkToolbarButton]}
      >
        <View style={[toolbarStyles.iconWrapper, toolbarStyles.active]}>
          <Image
            source={Images.link}
            style={[toolbarStyles.icon]}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>
      <TextInput
        value={link}
        onBlur={onBlur}
        onChangeText={setLink}
        placeholder="Type your URL here..."
        autoFocus
        style={linkBarStyles.linkInput}
      />
      <TouchableOpacity
        style={linkBarStyles.doneButton}
        onPress={() => {
          onEditLink(link);
        }}
      >
        <Text style={linkBarStyles.doneButtonText}>Insert</Text>
      </TouchableOpacity>
    </View>
  );
};

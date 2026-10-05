import React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import type { ArgsToolbarCB, ToolbarItem } from './actions';
import type { EditorBridge } from '../../types';

export const ToolbarItemComp = ({
  onPress,
  disabled,
  active,
  image,
  label,
  editor,
  args,
}: ToolbarItem & {
  editor: EditorBridge;
  args: ArgsToolbarCB;
}) => {
  const { toolbar } = editor.theme;
  const isActive = active(args);
  const isDisabled = disabled(args);

  return (
    <TouchableOpacity
      onPress={onPress(args)}
      disabled={isDisabled}
      style={[toolbar.toolbarButton]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive, disabled: isDisabled }}
    >
      <View
        style={[
          toolbar.iconWrapper,
          isActive ? toolbar.iconWrapperActive : undefined,
          isDisabled ? toolbar.iconWrapperDisabled : undefined,
        ]}
      >
        <Image
          source={image(args)}
          style={[
            toolbar.icon,
            isActive ? toolbar.iconActive : undefined,
            isDisabled ? toolbar.iconDisabled : undefined,
          ]}
          resizeMode="contain"
        />
      </View>
    </TouchableOpacity>
  );
};

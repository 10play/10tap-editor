import React from 'react';
import { Image, Platform, TouchableOpacity, View } from 'react-native';
import type { ArgsToolbarCB, ToolbarItem } from './actions';
import type { EditorBridge } from '../../types';

/**
 * Web: a mouse press on a button would move the page's focus out of the
 * editor iframe, so typing after a toolbar press (a heading toggle, the
 * heading sub-toolbar) went nowhere. Keeping the focus where it is leaves the
 * editor focused, as native toolbar buttons do. Keyboard users can still tab
 * to the buttons.
 */
const keepEditorFocus = {
  onMouseDown: (event: { preventDefault(): void }) => event.preventDefault(),
};

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
      {...(Platform.OS === 'web' ? keepEditorFocus : undefined)}
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

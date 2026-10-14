import React, { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { EditorBridge } from '../../types';
import type { ArgsToolbarCB, ToolbarItem } from './actions';
import { ToolbarItemComp } from './ToolbarItemComp';

interface WebToolbarProps {
  editor: EditorBridge;
  args: ArgsToolbarCB;
  items: ToolbarItem[];
  hidden?: boolean;
}

export const webToolbarStyles = StyleSheet.create({
  // As wide as its parent in a column and in a row (the documented
  // `flexDirection: 'row'` wrapper) without growing along a column, so the
  // theme's `flex: 1` bars fill the width instead of half the screen.
  bar: {
    flexDirection: 'row',
    width: '100%',
    flexShrink: 1,
    minWidth: 0,
  },
  scroll: {
    flexGrow: 1,
    flexShrink: 1,
  },
  items: {
    flexDirection: 'row',
  },
});

/** The web toolbar's outer box; also holds the link bar. */
export const WebToolbarBar = ({ children }: { children: ReactNode }) => (
  <View style={webToolbarStyles.bar}>{children}</View>
);

/**
 * The items in one row that scrolls sideways when it is wider than the
 * window, as the native toolbar's horizontal list does.
 */
export const WebToolbar = ({
  args,
  editor,
  hidden,
  items,
}: WebToolbarProps) => {
  if (hidden) return null;

  return (
    <WebToolbarBar>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        style={webToolbarStyles.scroll}
        contentContainerStyle={webToolbarStyles.items}
      >
        {items.map((item, i) => (
          <ToolbarItemComp {...item} args={args} editor={editor} key={i} />
        ))}
      </ScrollView>
    </WebToolbarBar>
  );
};

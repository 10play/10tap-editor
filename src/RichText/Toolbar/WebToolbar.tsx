import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { EditorBridge } from '../../types';
import type { ArgsToolbarCB, ToolbarItem } from './actions';
import { ToolbarItemComp } from './ToolbarItemComp';

interface WebToolbarProps {
  editor: EditorBridge;
  args: ArgsToolbarCB;
  items: ToolbarItem[];
  hidden?: boolean;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
});

export const WebToolbar = ({
  args,
  editor,
  hidden,
  items,
}: WebToolbarProps) => {
  if (hidden) return null;

  return (
    <View style={styles.row}>
      {items.map((item, i) => (
        <ToolbarItemComp {...item} args={args} editor={editor} key={i} />
      ))}
    </View>
  );
};

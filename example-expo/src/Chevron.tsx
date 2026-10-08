import React from 'react';
import { StyleSheet, View } from 'react-native';

type ChevronProps = {
  color: string;
  direction?: 'left' | 'right';
};

export const Chevron = ({ color, direction = 'right' }: ChevronProps) => (
  <View
    style={[
      styles.chevron,
      { borderColor: color },
      direction === 'left' ? styles.left : styles.right,
    ]}
  />
);

const styles = StyleSheet.create({
  chevron: {
    width: 9,
    height: 9,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderRadius: 1,
  },
  right: {
    transform: [{ rotate: '45deg' }],
  },
  left: {
    transform: [{ rotate: '-135deg' }],
  },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';

export const Separator = () => (
  <View style={styles.separatorContainer}>
    <View style={styles.separatorLine} />
  </View>
);

const styles = StyleSheet.create({
  separatorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    height: '100%',
  },
  separatorLine: {
    width: 1,
    height: '60%',
    backgroundColor: '#DEE0E3',
  },
});

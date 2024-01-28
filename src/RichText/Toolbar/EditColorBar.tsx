import React from 'react';
import { View, Button, StyleSheet } from 'react-native';

const toolbarStyles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
});

interface EditColorProps {
  onFinish: () => void;
}

export const EditColorBar = ({ onFinish }: EditColorProps) => {
  return (
    <View style={toolbarStyles.container}>
      <Button title="DONE" onPress={onFinish} />
    </View>
  );
};

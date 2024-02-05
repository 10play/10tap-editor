import { SvgXml } from 'react-native-svg';
import { icons } from '../assets';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';
import React from 'react';

interface IconProps {
  name: keyof typeof icons;
  style?: StyleProp<ViewStyle>;
  width?: number;
  height?: number;
  fill?: ColorValue;
}
export const Icon = ({
  style,
  name,
  fill,
  height = 24,
  width = 24,
}: IconProps) => {
  return (
    <SvgXml
      style={style}
      width={width}
      height={height}
      xml={icons[name]}
      fill={fill}
    />
  );
};

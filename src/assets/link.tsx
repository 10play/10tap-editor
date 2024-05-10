import * as React from 'react';
import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

function Link(fill: ColorValue = 'red', size: number = 24) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.172 14.829l5.657-5.657M7.05 11.293l-1.414 1.414a4 4 0 105.657 5.657l1.412-1.414m-1.413-9.9l1.414-1.414a4 4 0 115.657 5.657l-1.414 1.414"
        stroke={fill}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
export default Link;

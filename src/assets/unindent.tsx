import * as React from 'react';
import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';
const Unindent = (fill: ColorValue = 'red', size: number = 24) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill={fill}
      d="M6 4H4v16h2V4zm16 9H11.828l2.086 2.086L12.5 16.5 8 12l4.5-4.5 1.414 1.414L11.828 11H22v2z"
    />
  </Svg>
);
export default Unindent;

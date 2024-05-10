import * as React from 'react';
import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';
const H1 = (fill: ColorValue = 'red', size: number = 24) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      id="Vector"
      d="M16 10L19 9L19 19M3 5V12M3 12V19M3 12H11M11 5V12M11 12V19"
      stroke={fill}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default H1;

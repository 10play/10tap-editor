import * as React from 'react';
import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

function BulletList(fill: ColorValue = 'red', size: number = 24) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 17h10M9 12h10M9 7h10M5.002 17v.002H5V17h.002zm0-5v.002H5V12h.002zm0-5v.002H5V7h.002z"
        stroke={fill}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default BulletList;

import * as React from 'react';
import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

function Indent(fill: ColorValue = 'red', size: number = 24) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={fill}
        d="M18 20h2V4h-2v16zM2 11h10.172l-2.086-2.086L11.5 7.5 16 12l-4.5 4.5-1.414-1.414L12.172 13H2v-2z"
      />
    </Svg>
  );
}

export default Indent;

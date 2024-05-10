import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { ColorValue } from 'react-native';

const A = ({
  fill = 'red',
  size = 24,
}: {
  fill: ColorValue | undefined;
  size: number;
}) => (
  <Svg fill={fill} width={size} height={size} viewBox="0 0 32 32">
    <Path d="M28.34 26.854l-10.527-22.4c-0.131-0.274-0.405-0.46-0.724-0.46-0 0-0 0-0 0h-1.088c-0 0-0 0-0 0-0.318 0-0.593 0.186-0.721 0.455l-0.002 0.005-10.529 22.4c-0.048 0.1-0.077 0.217-0.077 0.341 0 0.441 0.358 0.799 0.799 0.799 0 0 0.001 0 0.001 0h0.992c0.319-0 0.594-0.186 0.723-0.456l0.002-0.005 2.44-5.203h13.801l2.471 5.207c0.131 0.272 0.405 0.457 0.723 0.457h0.992c0 0 0 0 0 0 0.442 0 0.8-0.358 0.8-0.8 0-0.124-0.028-0.241-0.078-0.345l0.002 0.005zM10.798 19.801l5.744-12.17 5.718 12.17z" />
  </Svg>
);
export default A;

import * as React from 'react';
import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

function Strikethrough(fill: ColorValue = 'red', size: number = 24) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 12c.896 0 1.775.193 2.546.557.348.165.669.362.955.587.347.272.645.585.881.93.432.627.644 1.336.616 2.052-.028.716-.296 1.412-.776 2.017-.48.605-1.154 1.096-1.952 1.42a6.075 6.075 0 01-2.583.43 5.865 5.865 0 01-2.497-.685c-.74-.402-1.332-.957-1.713-1.605M12 12H4m8 0h8m-3.476-5.703c-.381-.648-.973-1.202-1.714-1.605a5.866 5.866 0 00-2.496-.684 6.075 6.075 0 00-2.584.428c-.798.325-1.472.816-1.952 1.42-.48.606-.747 1.303-.776 2.019-.008.21.005.418.037.625"
        stroke={fill}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default Strikethrough;

import { Platform, View } from 'react-native';
import type { ViewProps } from 'react-native';
import type { Int32 } from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent, {
  type NativeComponentType,
} from 'react-native/Libraries/Utilities/codegenNativeComponent';

interface NativeProps extends ViewProps {
  keyboardHeight: Int32;
  keyboardID?: string;
  inputTag?: Int32;
  rootBackground?: Int32;
}

let TenTapView: NativeComponentType<NativeProps>;

if (Platform.OS === 'ios' || Platform.OS === 'android') {
  try {
    const { NativeModules } = require('react-native');
    if (NativeModules.TenTapView) {
      TenTapView = codegenNativeComponent<NativeProps>('TenTapView');
    } else {
      TenTapView = View as unknown as NativeComponentType<NativeProps>;
    }
  } catch (err) {
    console.warn('Failed to load TenTapView:', err);
    TenTapView = View as unknown as NativeComponentType<NativeProps>;
  }
} else {
  TenTapView = View as unknown as NativeComponentType<NativeProps>;
}

export default TenTapView;

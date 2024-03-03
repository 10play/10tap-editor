import { NativeModules, Platform } from 'react-native';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type { ViewProps } from 'react-native';
import type { Int32 } from 'react-native/Libraries/Types/CodegenTypes';

interface NativeProps extends ViewProps {
  keyboardHeight: Int32;
  keyboardID?: string;
  inputTag?: Int32;
  rootBackground?: Int32;
}

if (Platform.OS === 'ios') {
  NativeModules.TenTapView?.setBridge();
}

export default codegenNativeComponent<NativeProps>('TenTapView');

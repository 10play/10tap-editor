import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type { ViewProps } from 'react-native';
import type { Int32 } from 'react-native/Libraries/Types/CodegenTypes';

interface NativeProps extends ViewProps {
  text?: string;
  placeholder?: string;
  inputTag?: Int32;
}

export default codegenNativeComponent<NativeProps>('TenTapView');

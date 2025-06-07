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
    // Only export codegenNativeComponent if the TenTapView native module is available
    // This fixes https://github.com/10play/10tap-editor/issues/300#issuecomment-2948843654
    if (NativeModules.TenTapView) {
      if (Platform.OS === 'ios') {
        NativeModules.TenTapView.setBridge();
      }
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

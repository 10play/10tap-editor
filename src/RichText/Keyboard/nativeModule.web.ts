import type { Spec as NativeKeyboardModule } from '../../specs/NativeTenTapKeyboard';

// react-native-web has no TurboModuleRegistry; importing the spec would throw.
export const getNativeKeyboardModule = (): NativeKeyboardModule | null => null;

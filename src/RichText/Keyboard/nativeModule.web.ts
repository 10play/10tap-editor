import type { NativeKeyboardModule } from './drivers';

// react-native-web has no TurboModuleRegistry; importing the spec would throw.
export const getNativeKeyboardModule = (): NativeKeyboardModule | null => null;

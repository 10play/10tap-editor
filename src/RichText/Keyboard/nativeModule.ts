import NativeTenTapKeyboard from '../../specs/NativeTenTapKeyboard';
import type { NativeKeyboardModule } from './drivers';

/** The linked native module, or null (Expo Go, not rebuilt). */
export const getNativeKeyboardModule = (): NativeKeyboardModule | null =>
  NativeTenTapKeyboard;

import NativeTenTapKeyboard, {
  type Spec as NativeKeyboardModule,
} from '../../specs/NativeTenTapKeyboard';

/** The linked native module, or null (Expo Go, not rebuilt). */
export const getNativeKeyboardModule = (): NativeKeyboardModule | null =>
  NativeTenTapKeyboard;

// The 0.7.x platform keyboards import the package root, which needs tiptap v2.
// Capturing the keyboard surface only needs these two to exist.
export { View as TenTapView } from 'react-native';
export const useKeyboard = () => ({ isKeyboardUp: false, keyboardHeight: 0 });

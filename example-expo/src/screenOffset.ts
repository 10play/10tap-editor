import { createContext, useContext } from 'react';

/**
 * Distance from the top of the window to the top of the example screen.
 * KeyboardAvoidingView measures its frame relative to its parent, so a screen
 * below a header passes this as `keyboardVerticalOffset`.
 */
export const ScreenOffsetContext = createContext(0);

export const useKeyboardVerticalOffset = () => useContext(ScreenOffsetContext);

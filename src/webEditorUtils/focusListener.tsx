import { getFocusTracker } from '../web/focus';

export { getFocusTracker, type FocusTracker } from '../web/focus';

/**
 * @deprecated Use `getFocusTracker()`. Kept for deep imports; importing it no
 * longer touches the DOM (#339).
 */
export const focusListener: { readonly isFocused: boolean } = {
  get isFocused() {
    return getFocusTracker().isFocused;
  },
};

import type { ViewProps } from 'react-native';

/** Props of the 0.7.x native keyboard host view. */
export interface TenTapViewProps extends ViewProps {
  keyboardHeight: number;
  keyboardID?: string;
  inputTag?: number;
  rootBackground?: number;
}

let warned = false;

/**
 * @deprecated The 0.7.x native keyboard host view. `CustomKeyboard` renders
 * keyboards in the app's own tree now, so this renders nothing.
 */
export const TenTapView = (_props: TenTapViewProps) => {
  if (__DEV__ && !warned) {
    warned = true;
    console.warn(
      '[TenTap] TenTapView is deprecated and renders nothing. Render <CustomKeyboard> instead.'
    );
  }
  return null;
};

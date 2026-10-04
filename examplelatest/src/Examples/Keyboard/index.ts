import { CustomKeyboardExample } from './CustomKeyboardExample';
import { ModalKeyboardExample } from './ModalKeyboardExample';
import { OverlayKeyboardExample } from './OverlayKeyboardExample';
import { WithKeyboard } from './WithKeyboard';

/** Screens for the example navigator; the names are the E2E entry points. */
export const keyboardExamples = [
  { name: 'Keyboard: Color', component: WithKeyboard },
  { name: 'Keyboard: Custom', component: CustomKeyboardExample },
  { name: 'Keyboard: Overlay', component: OverlayKeyboardExample },
  { name: 'Keyboard: Modal', component: ModalKeyboardExample },
];

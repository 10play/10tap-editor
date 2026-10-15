import type { ComponentType } from 'react';
import { Basic } from './screens/Basic';
import { CustomKeyboard } from './screens/CustomKeyboard';
import { DynamicHeight } from './screens/DynamicHeight';
import { OverlayKeyboard } from './screens/OverlayKeyboard';
import { TwoEditors } from './screens/TwoEditors';

export type Example = {
  name: string;
  description: string;
  component: ComponentType;
};

export type ExampleSection = { title: string; examples: Example[] };

export const sections: ExampleSection[] = [
  {
    title: 'Basics',
    examples: [
      {
        name: 'Basic',
        description: 'An editor with the default toolbar over the keyboard.',
        component: Basic,
      },
      {
        name: 'Two Editors',
        description: 'Two editors on one screen sharing a toolbar.',
        component: TwoEditors,
      },
    ],
  },
  {
    title: 'Keyboard',
    examples: [
      {
        name: 'Custom Keyboard',
        description: 'Swap the system keyboard for a color picker.',
        component: CustomKeyboard,
      },
      {
        name: 'Overlay Keyboard',
        description: 'The custom keyboard drawn over the screen.',
        component: OverlayKeyboard,
      },
    ],
  },
  {
    title: 'Layout & Dynamic Height',
    examples: [
      {
        name: 'Dynamic Height',
        description: 'Editors that size themselves to their content.',
        component: DynamicHeight,
      },
    ],
  },
];

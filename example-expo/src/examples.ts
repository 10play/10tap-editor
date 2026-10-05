import type { ComponentType } from 'react';
import { Basic } from './screens/Basic';
import { CustomKeyboard } from './screens/CustomKeyboard';
import { DynamicHeight } from './screens/DynamicHeight';
import { TwoEditors } from './screens/TwoEditors';

export type Example = { name: string; component: ComponentType };

export const examples: Example[] = [
  { name: 'Basic', component: Basic },
  { name: 'Dynamic Height', component: DynamicHeight },
  { name: 'Custom Keyboard', component: CustomKeyboard },
  { name: 'Two Editors', component: TwoEditors },
];

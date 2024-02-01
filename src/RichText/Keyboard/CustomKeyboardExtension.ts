import type { ComponentType } from 'react';
import { AppRegistry } from 'react-native';

export class CustomKeyboardExtension {
  constructor(public id: string, public comp: ComponentType<any>) {
    this.id = id;
    this.comp = comp;
    AppRegistry.registerComponent(id, () => comp);
  }
}

// Deliberately broken TenTapKeyboard spec: used to check that
// `scripts/check-codegen.js --spec test/fixtures/brokenSpec.ts` fails.
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  setSystemKeyboardSuppressed(suppressed: boolean): Promise<boolean>;
  showSystemKeyboard(): void;
  isSystemKeyboardVisible(): Promise<boolean>;
  getNavigationBarInset(): Promise<number>;
  extraMethod(): void;
}

export default TurboModuleRegistry.get<Spec>('TenTapKeyboard');

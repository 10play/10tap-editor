import { AutofocusExample } from './AutofocusExample';
import { ContentApiExample } from './ContentApiExample';
import { DynamicHeightExample } from './DynamicHeightExample';
import { ReadinessExample } from './ReadinessExample';
import { SmokeExample } from './SmokeExample';

/**
 * Screens driven by the Maestro flows in `.maestro/smoke` and
 * `.maestro/repro`; the names are the E2E entry points.
 */
export const reproExamples = [
  { name: 'E2E: Smoke', component: SmokeExample },
  { name: 'Repro: Readiness', component: ReadinessExample },
  { name: 'Repro: Autofocus', component: AutofocusExample },
  { name: 'Repro: Dynamic height', component: DynamicHeightExample },
  { name: 'Repro: Content API', component: ContentApiExample },
];

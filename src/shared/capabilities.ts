/**
 * Features a web bundle advertises in its `editor-ready` payload. Native code
 * gates new behaviour on these so legacy (1.0.x / 0.7.x) custom bundles keep
 * working: a bundle that sends no payload has no capabilities.
 */
export const CAPABILITIES = {
  /** `window.__tentap.applyStyleSheet(tag, css)` exists. */
  Styles: 'styles',
  /** Handles the `insert-content` command (#62). */
  InsertContent: 'insertContent',
  /** Answers `get-selected-text` with `send-selected-text-back` (#338). */
  SelectedText: 'selectedText',
  /** Applies `parseOptions` from the boot config and from `set-content` (#327). */
  ParseOptions: 'parseOptions',
  /** Decides dynamic-height scroll clamping from native `container-height`. */
  ContainerHeight: 'containerHeight',
  /** `window.__tentap.setInputMode(mode)` exists (custom keyboard). */
  InputMode: 'inputMode',
} as const;

export type KnownCapability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

/** A known capability, or one advertised by a newer bundle. */
export type CapabilityName = KnownCapability | (string & {});

/** What native knows about the web bundle running in the WebView. */
export interface Capabilities {
  /** Wire protocol version: 1 for legacy bundles, 2 or higher otherwise. */
  readonly protocol: number;
  /** True when the bundle sent no `editor-ready` handshake payload. */
  readonly legacy: boolean;
  readonly names: readonly CapabilityName[];
}

/** The full set advertised by this version's web runtime. */
export const WEB_RUNTIME_CAPABILITIES: readonly KnownCapability[] =
  Object.freeze(Object.values(CAPABILITIES));

export const LEGACY_CAPABILITIES: Capabilities = Object.freeze({
  protocol: 1,
  legacy: true,
  names: Object.freeze([]),
});

export function createCapabilities(
  protocol: number,
  names: readonly CapabilityName[]
): Capabilities {
  return Object.freeze({
    protocol,
    legacy: false,
    names: Object.freeze(Array.from(new Set(names))),
  });
}

export function hasCapability(
  capabilities: Capabilities,
  name: CapabilityName
): boolean {
  return capabilities.names.includes(name);
}

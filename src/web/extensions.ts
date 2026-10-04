import type { AnyExtension } from '@tiptap/core';
import type BridgeExtension from '../bridges/base';
import {
  resolveBridgeConfig,
  type BootConfig,
  type BridgeConfigEntry,
} from '../shared/bootConfig';

/**
 * The bridges a bundle should run: those the native side configured (looked
 * up through the `undoRedo`/`history` alias) or whitelisted. A 1.0 native
 * side sends both for the same list, so this matches 1.0, which dropped any
 * bridge without a config entry.
 */
export function selectActiveBridges(
  bridges: readonly BridgeExtension[],
  config: Pick<BootConfig, 'bridgeConfigs' | 'whitelist'>
): BridgeExtension[] {
  return bridges.filter(
    (bridge) =>
      resolveBridgeConfig(config.bridgeConfigs, bridge.name) !== undefined ||
      config.whitelist.includes(bridge.name)
  );
}

// TODO(WP-G): delegate to `configureTiptapExtensionsOnRunTime` once it no
// longer mutates the bridge.
function configureBridge(
  bridge: BridgeExtension,
  entry: BridgeConfigEntry | undefined
): { main?: AnyExtension; deps: AnyExtension[] } {
  let main = bridge.tiptapExtension;
  if (main && entry?.optionsConfig) main = main.configure(entry.optionsConfig);
  if (main && entry?.extendConfig) main = main.extend(entry.extendConfig);
  return { main, deps: bridge.tiptapExtensionDeps ?? [] };
}

/**
 * The TipTap extensions of `bridges`, configured from the boot config without
 * mutating any bridge (#309). CSS-only bridges contribute nothing. Shared
 * dependencies (`textStyle` of Color and Highlight, `listItem` of the list
 * bridges) are included once, and never in place of a bridge's own extension
 * of the same name.
 */
export function resolveBridgeExtensions(
  bridges: readonly BridgeExtension[],
  config: Pick<BootConfig, 'bridgeConfigs'>
): AnyExtension[] {
  const configured = bridges.map((bridge) =>
    configureBridge(
      bridge,
      resolveBridgeConfig(config.bridgeConfigs, bridge.name)
    )
  );
  const names = new Set(
    configured.flatMap(({ main }) => (main ? [main.name] : []))
  );
  const extensions: AnyExtension[] = [];
  for (const { main, deps } of configured) {
    if (main) extensions.push(main);
    for (const dep of deps) {
      if (names.has(dep.name)) continue;
      names.add(dep.name);
      extensions.push(dep);
    }
  }
  return extensions;
}

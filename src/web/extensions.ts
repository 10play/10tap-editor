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

/**
 * The bridges whose state and message handlers run: the active ones, plus
 * bridges without a TipTap extension, which 1.0 ran even when native had not
 * configured them (e.g. a web-only bridge that only extends the state).
 */
export function selectHandlerBridges(
  bridges: readonly BridgeExtension[],
  active: readonly BridgeExtension[]
): BridgeExtension[] {
  return bridges.filter(
    (bridge) => active.includes(bridge) || !bridge.tiptapExtension
  );
}

function configureBridge(
  bridge: BridgeExtension,
  entry: BridgeConfigEntry | undefined
): { main?: AnyExtension; deps: AnyExtension[] } {
  const extensions = bridge.configureTiptapExtensionsOnRunTime(
    entry?.optionsConfig,
    entry?.extendConfig
  );
  if (!bridge.tiptapExtension) return { deps: extensions };
  const [main, ...deps] = extensions;
  return { main, deps };
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

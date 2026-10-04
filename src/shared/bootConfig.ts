import { PROTOCOL_VERSION } from './protocol';
import { safeJSON } from './safeJson';

/**
 * Boot configuration handed to the web runtime before its bundle runs.
 *
 * Native inlines `buildBootScript(config)` into the editor HTML (and passes it
 * as `injectedJavaScriptBeforeContentLoaded` for `uri`/DEV sources). The
 * script sets `window.__TENTAP__` for the new runtime plus the 1.0 globals
 * (`window.bridgeExtensionConfigMap`, `window.contentInjected`, …) that legacy
 * custom bundles read.
 */

export const BOOT_CONFIG_GLOBAL = '__TENTAP__';
/** Web runtime API object (`window.__tentap`), see `TentapWebRuntime`. */
export const WEB_RUNTIME_GLOBAL = '__tentap';
/** Optional insertion point for the boot script in a custom `index.html`. */
export const BOOT_MARKER = '<!--TENTAP_BOOT-->';

/** Name of `HistoryBridge` since TipTap v3. */
export const HISTORY_BRIDGE_NAME = 'undoRedo';
/** Name of `HistoryBridge` in 0.7.x (TipTap v2) bundles. */
export const LEGACY_HISTORY_BRIDGE_NAME = 'history';

export type RuntimePlatform = 'ios' | 'android' | 'web' | 'windows' | 'macos';

export interface BridgeConfigEntry {
  optionsConfig?: unknown;
  extendConfig?: unknown;
}

export type BridgeConfigMap = Record<string, BridgeConfigEntry>;

/** The JSON-serialisable part of ProseMirror's `ParseOptions` (#327). */
export interface SerializableParseOptions {
  preserveWhitespace?: boolean | 'full';
  from?: number;
  to?: number;
  topOpen?: boolean;
}

export interface BootConfig {
  protocol: number;
  editorId: string;
  /** Keyed by bridge name; includes the `history` alias, see `buildBridgeConfigs`. */
  bridgeConfigs: BridgeConfigMap;
  /** Names of the native bridges, in order. */
  whitelist: string[];
  initialContent?: string | object;
  editable: boolean;
  disableColorHighlight: boolean;
  dynamicHeight: boolean;
  platform: RuntimePlatform;
  parseOptions?: SerializableParseOptions;
}

/** The fields of a `BridgeExtension` the boot config needs. */
export interface BootBridge {
  name: string;
  config?: unknown;
  extendConfig?: unknown;
}

export interface BootConfigInput {
  editorId: string;
  /** Already deduplicated by name (last wins), as `useEditorBridge` does. */
  bridges: readonly BootBridge[];
  platform: RuntimePlatform;
  initialContent?: string | object;
  /** Defaults to true. */
  editable?: boolean;
  disableColorHighlight?: boolean;
  dynamicHeight?: boolean;
  parseOptions?: SerializableParseOptions;
}

/** The 1.0 window globals, with the values a 1.0.1 native side wrote. */
export interface LegacyGlobals {
  /** JSON string of the bridge config map. */
  bridgeExtensionConfigMap: string;
  whiteListBridgeExtensions: string[];
  /** Only set when the initial content is truthy. */
  initialContent?: string | object;
  editable: boolean;
  disableColorHighlight: boolean;
  dynamicHeight: boolean;
  contentInjected: true;
  platform: RuntimePlatform;
}

/**
 * Maps bridge names to their configs. `HistoryBridge` is named `undoRedo`
 * since TipTap v3, while 0.7.x bundles look it up as `history`, so the entry
 * is also published as `history` unless a bridge already has that name.
 */
export function buildBridgeConfigs(
  bridges: readonly BootBridge[]
): BridgeConfigMap {
  const configs: BridgeConfigMap = {};
  for (const bridge of bridges) {
    configs[bridge.name] = {
      optionsConfig: bridge.config,
      extendConfig: bridge.extendConfig,
    };
  }
  const history = configs[HISTORY_BRIDGE_NAME];
  if (history && !(LEGACY_HISTORY_BRIDGE_NAME in configs)) {
    configs[LEGACY_HISTORY_BRIDGE_NAME] = history;
  }
  return configs;
}

/** Looks up a bridge's config, resolving the `undoRedo`/`history` alias. */
export function resolveBridgeConfig(
  configs: BridgeConfigMap,
  name: string
): BridgeConfigEntry | undefined {
  const own = Object.prototype.hasOwnProperty.call(configs, name)
    ? configs[name]
    : undefined;
  if (own) return own;
  if (name === HISTORY_BRIDGE_NAME) return configs[LEGACY_HISTORY_BRIDGE_NAME];
  if (name === LEGACY_HISTORY_BRIDGE_NAME) return configs[HISTORY_BRIDGE_NAME];
  return undefined;
}

export function buildBootConfig(input: BootConfigInput): BootConfig {
  const config: BootConfig = {
    protocol: PROTOCOL_VERSION,
    editorId: input.editorId,
    bridgeConfigs: buildBridgeConfigs(input.bridges),
    whitelist: input.bridges.map((bridge) => bridge.name),
    editable: input.editable ?? true,
    disableColorHighlight: !!input.disableColorHighlight,
    dynamicHeight: !!input.dynamicHeight,
    platform: input.platform,
  };
  if (input.initialContent) config.initialContent = input.initialContent;
  if (input.parseOptions) config.parseOptions = input.parseOptions;
  return config;
}

export function legacyGlobalsFromBootConfig(config: BootConfig): LegacyGlobals {
  return {
    bridgeExtensionConfigMap: JSON.stringify(config.bridgeConfigs),
    whiteListBridgeExtensions: [...config.whitelist],
    ...(config.initialContent ? { initialContent: config.initialContent } : {}),
    editable: config.editable,
    disableColorHighlight: config.disableColorHighlight,
    dynamicHeight: config.dynamicHeight,
    contentInjected: true,
    platform: config.platform,
  };
}

/**
 * Reads the 1.0 globals written by a 1.0.x native side into a boot config.
 * Legacy natives have no editor id, so the runtime supplies its own.
 */
export function bootConfigFromLegacyGlobals(
  globals: Partial<Record<keyof LegacyGlobals, unknown>>,
  editorId: string
): BootConfig {
  let bridgeConfigs: BridgeConfigMap = {};
  if (typeof globals.bridgeExtensionConfigMap === 'string') {
    try {
      const parsed: unknown = JSON.parse(globals.bridgeExtensionConfigMap);
      if (typeof parsed === 'object' && parsed !== null) {
        bridgeConfigs = parsed as BridgeConfigMap;
      }
    } catch {
      // A 1.0.1 native side breaks this string when a config contains `'`.
    }
  }
  const whitelist = Array.isArray(globals.whiteListBridgeExtensions)
    ? globals.whiteListBridgeExtensions.filter(
        (name): name is string => typeof name === 'string'
      )
    : [];
  const config: BootConfig = {
    protocol: 1,
    editorId,
    bridgeConfigs,
    whitelist,
    editable: globals.editable !== false && globals.editable !== 'false',
    disableColorHighlight: !!globals.disableColorHighlight,
    dynamicHeight: !!globals.dynamicHeight,
    platform: isRuntimePlatform(globals.platform) ? globals.platform : 'web',
  };
  const content = globals.initialContent;
  if (content && (typeof content === 'string' || typeof content === 'object')) {
    config.initialContent = content;
  }
  return config;
}

/** Validates `window.__TENTAP__`. Returns null when it is not a boot config. */
export function readBootConfig(value: unknown): BootConfig | null {
  if (typeof value !== 'object' || value === null) return null;
  const config = value as Partial<BootConfig>;
  if (
    typeof config.protocol !== 'number' ||
    typeof config.editorId !== 'string' ||
    typeof config.bridgeConfigs !== 'object' ||
    config.bridgeConfigs === null ||
    !Array.isArray(config.whitelist) ||
    typeof config.editable !== 'boolean' ||
    !isRuntimePlatform(config.platform)
  ) {
    return null;
  }
  return config as BootConfig;
}

const RUNTIME_PLATFORMS: readonly string[] = [
  'ios',
  'android',
  'web',
  'windows',
  'macos',
];

function isRuntimePlatform(value: unknown): value is RuntimePlatform {
  return typeof value === 'string' && RUNTIME_PLATFORMS.includes(value);
}

/**
 * Statements that set exactly the 1.0 window globals. Every value is a
 * JSON literal, so configs containing quotes, backticks, `${`, `</script>` or
 * line separators cannot break the script (they did in 1.0.1).
 */
export function buildLegacyGlobalsScript(config: BootConfig): string {
  return Object.entries(legacyGlobalsFromBootConfig(config))
    .map(([key, value]) => `window.${key}=${safeJSON(value)};`)
    .join('');
}

/**
 * Sets `window.__TENTAP__` and the legacy globals once. Safe to evaluate
 * repeatedly (inline, before-content-loaded and `onLoad` re-injection), and
 * creates no implicit globals. Ends with `true;` as WebView injection expects.
 */
export function buildBootScript(config: BootConfig): string {
  return (
    '(function(){"use strict";' +
    `if(window.${BOOT_CONFIG_GLOBAL})return;` +
    `window.${BOOT_CONFIG_GLOBAL}=${safeJSON(config)};` +
    buildLegacyGlobalsScript(config) +
    '})();true;'
  );
}

const HEAD_OPEN_TAG = /<head(?:\s[^>]*)?>/i;
const HTML_OPEN_TAG = /<html(?:\s[^>]*)?>/i;
const DOCTYPE = /^\s*<!doctype[^>]*>/i;

/**
 * Inlines the boot script so it runs before any bundle script. It replaces
 * the first `<!--TENTAP_BOOT-->` marker if present, otherwise it goes right
 * after the opening `<head>` tag (never `<header>`), then after `<html>`,
 * then after the doctype, and is prepended as a last resort.
 */
export function injectBootIntoHtml(html: string, config: BootConfig): string {
  const tag = `<script>${buildBootScript(config)}</script>`;
  const markerIndex = html.indexOf(BOOT_MARKER);
  if (markerIndex !== -1) {
    return spliceAt(html, markerIndex, BOOT_MARKER.length, tag);
  }
  for (const pattern of [HEAD_OPEN_TAG, HTML_OPEN_TAG, DOCTYPE]) {
    const match = pattern.exec(html);
    if (match) return spliceAt(html, match.index + match[0].length, 0, tag);
  }
  return tag + html;
}

function spliceAt(
  source: string,
  index: number,
  deleteCount: number,
  insert: string
): string {
  return source.slice(0, index) + insert + source.slice(index + deleteCount);
}

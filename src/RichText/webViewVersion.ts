let webViewVersion: string | null | undefined;

/**
 * The installed react-native-webview version, if its package.json resolves.
 * Web uses `webViewVersion.web.ts`: the web shims aliased to
 * react-native-webview don't export their package.json, and bundlers warn
 * about the require even though it would be caught.
 */
export const getWebViewVersion = (): string | undefined => {
  if (webViewVersion === undefined) {
    try {
      const pkg: unknown = require('react-native-webview/package.json');
      const { version } = (pkg ?? {}) as { version?: unknown };
      webViewVersion = typeof version === 'string' ? version : null;
    } catch {
      webViewVersion = null;
    }
  }
  return webViewVersion ?? undefined;
};

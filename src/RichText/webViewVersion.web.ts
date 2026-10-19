/**
 * On web react-native-webview is an iframe shim, whose version only matters
 * to native workarounds; its package.json is not looked up.
 */
export const getWebViewVersion = (): string | undefined => undefined;

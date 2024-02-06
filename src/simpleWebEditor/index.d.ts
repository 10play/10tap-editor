export {};
declare global {
  interface Window {
    initialContent: string;
    bridgeExtensionConfigMap: string;
    whiteListBridgeExtensions: string[];
    ReactNativeWebView: { postMessage: (message: string) => void };
  }
}

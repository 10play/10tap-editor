export {};
declare global {
  interface Window {
    initialContent: string;
    plugConfig: string;
    whiteListPlugins: string[];
    ReactNativeWebView: { postMessage: (message: string) => void };
  }
}

import type { TentapWebRuntime } from '../shared/contracts';

/**
 * The single `Window` augmentation of the web side. The 1.0 globals keep the
 * exact types `@10play/tentap-editor/web` declared in 1.0.1: custom bundles
 * redeclare some of them and TypeScript requires identical declarations.
 * `contentInjected` and `lastMessageID` stay undeclared for the same reason
 * (templates declare the former themselves).
 */
declare global {
  interface Window {
    initialContent: string;
    editable: string;
    bridgeExtensionConfigMap: string;
    whiteListBridgeExtensions: string[];
    dynamicHeight?: boolean;
    disableColorHighlight?: boolean;
    platform?: 'ios' | 'android' | 'web';
    ReactNativeWebView: { postMessage: (message: string) => void };
    /** Boot config written by the native side, see `shared/bootConfig`. */
    __TENTAP__?: unknown;
    __tentap?: TentapWebRuntime;
  }
}

export {};

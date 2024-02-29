import { useMemo, useRef } from 'react';
import WebView from 'react-native-webview';
import cloneDeep from 'lodash/cloneDeep';
import {
  type EditorActionMessage,
  EditorMessageType,
} from '../types/Messaging';
import { type BridgeState } from '../types/EditorBridge';
import { EditorHelper } from './EditorHelper';
import type { EditorBridge, EditorTheme } from '../types';
import type BridgeExtension from '../bridges/base';
import { TenTapStartKit } from '../bridges/StarterKit';
import { uniqueBy } from '../utils';
import { defaultEditorTheme } from './theme';
import type { Subscription } from '../types/Subscription';
import { getStyleSheetCSS } from './utils';
import { mergeThemes } from '../utils/mergeThemes';
import { isFabric } from '../utils/misc';
import { Platform } from 'react-native';

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

export const useEditorBridge = (options?: {
  bridgeExtensions?: BridgeExtension<any, any, any>[];
  initialContent?: string;
  autofocus?: boolean;
  avoidIosKeyboard?: boolean;
  customSource?: string;
  webviewBaseURL?: string;
  onChange?: () => void;
  DEV?: boolean;
  DEV_SERVER_URL?: string;
  theme?: RecursivePartial<EditorTheme>;
}): EditorBridge => {
  const webviewRef = useRef<WebView>(null);
  // Till we will implement default per bridgeExtension
  const editorStateRef = useRef<BridgeState | {}>({});
  const editorStateSubsRef = useRef<((state: BridgeState) => void)[]>([]);
  const editorContentSubsRef = useRef<(() => void)[]>([]);

  const bridgeExtensions = useMemo(() => {
    const extensions = options?.bridgeExtensions || TenTapStartKit;
    // Filter out duplicates - the last one wins
    return uniqueBy(extensions, 'name');
  }, [options?.bridgeExtensions]);

  const mergedTheme = useMemo(
    // We must deep clone defaultEditorTheme, because it is read only
    () => mergeThemes(cloneDeep(defaultEditorTheme), options?.theme),
    [options?.theme]
  );

  const _updateEditorState = (editorState: BridgeState) => {
    editorStateRef.current = editorState;
    editorStateSubsRef.current.forEach((sub) => sub(editorState));
  };

  const _onContentUpdate = () => {
    editorContentSubsRef.current.forEach((sub) => sub());
    options?.onChange?.();
  };

  const _subscribeToEditorStateUpdate: Subscription<BridgeState> = (cb) => {
    editorStateSubsRef.current.push(cb);
    return () => {
      editorStateSubsRef.current = editorStateSubsRef.current.filter(
        (sub) => sub !== cb
      );
    };
  };

  const _subscribeToContentUpdate: Subscription<void> = (cb) => {
    editorContentSubsRef.current.push(cb);
    return () => {
      editorContentSubsRef.current = editorContentSubsRef.current.filter(
        (sub) => sub !== cb
      );
    };
  };

  const getEditorState = () => {
    return editorStateRef.current;
  };

  const sendMessage = (message: EditorActionMessage) => {
    if (!webviewRef.current) return console.warn("Editor isn't ready yet");
    // Workaround for https://github.com/react-native-webview/react-native-webview/issues/3305
    // On the new arch on Android, messages are sent twice, so if we toggle bold it immediately toggles back
    // We workaround this by adding a random id to the message and not handling it twice on the web side
    if (isFabric() && Platform.OS === 'android') {
      message.id = Math.random().toString(36).substring(7);
    }
    webviewRef.current?.postMessage(JSON.stringify(message));
  };

  const sendAction = (action: any) => {
    sendMessage({
      type: EditorMessageType.Action,
      payload: action,
    });
  };

  /**
   * Injects custom css stylesheet, if stylesheet exists with the same tag, it will be replaced
   * @param cssString css to inject
   * @param tag optional - tag to identify the style element
   */
  const injectCSS = (cssString: string, tag: string = 'custom-css') => {
    // Generate custom stylesheet with `custom-css` tag
    const customCSS = getStyleSheetCSS(cssString, tag);
    webviewRef.current?.injectJavaScript(customCSS);
  };

  const editorBridge = {
    bridgeExtensions,
    initialContent: options?.initialContent,
    autofocus: options?.autofocus,
    avoidIosKeyboard: options?.avoidIosKeyboard,
    customSource: options?.customSource,
    webviewBaseURL: options?.webviewBaseURL,
    DEV_SERVER_URL: options?.DEV_SERVER_URL,
    DEV: options?.DEV,
    webviewRef,
    theme: mergedTheme,
    getEditorState,
    injectCSS,
    _updateEditorState,
    _subscribeToEditorStateUpdate,
    _onContentUpdate,
    _subscribeToContentUpdate,
  };

  const editorInstance = (bridgeExtensions || []).reduce((acc, cur) => {
    if (!cur.extendEditorInstance) return acc;
    return Object.assign(
      acc,
      cur.extendEditorInstance(
        sendAction,
        webviewRef,
        editorStateRef,
        _updateEditorState
      ),
      webviewRef,
      editorStateRef.current,
      _updateEditorState
    );
  }, editorBridge) as EditorBridge; // TODO fix type

  EditorHelper.setEditorLastInstance(editorInstance);

  return editorInstance;
};

import { useCallback, useEffect, useMemo, useRef } from 'react';
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

const isAndroid = Platform.OS === 'android';

export const useEditorBridge = (options?: {
  bridgeExtensions?: BridgeExtension<any, any, any>[];
  initialContent?: string | object;
  autofocus?: boolean;
  avoidIosKeyboard?: boolean;
  customSource?: string;
  webviewBaseURL?: string;
  dynamicHeight?: boolean;
  disableColorHighlight?: boolean;
  editable?: boolean;
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

  const editable = options?.editable === undefined ? true : options.editable;

  useEffect(() => {
    if (options) {
      // Special case for editable prop, since its command is on the core bridge and we want to access it via useEditorBridge
      editorInstance?.setEditable(editable);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable]);

  const _updateEditorState = useCallback((editorState: BridgeState) => {
    editorStateRef.current = editorState;
    editorStateSubsRef.current.forEach((sub) => sub(editorState));
  }, []);

  const _onContentUpdate = useCallback(() => {
    editorContentSubsRef.current.forEach((sub) => sub());
    options?.onChange?.();
  }, [options?.onChange]);

  const _subscribeToEditorStateUpdate: Subscription<BridgeState> = useCallback(
    (cb) => {
      editorStateSubsRef.current.push(cb);
      return () => {
        editorStateSubsRef.current = editorStateSubsRef.current.filter(
          (sub) => sub !== cb
        );
      };
    },
    []
  );

  const _subscribeToContentUpdate: Subscription<void> = useCallback((cb) => {
    editorContentSubsRef.current.push(cb);
    return () => {
      editorContentSubsRef.current = editorContentSubsRef.current.filter(
        (sub) => sub !== cb
      );
    };
  }, []);

  const getEditorState = useCallback(() => {
    return editorStateRef.current;
  }, []);

  const sendMessage = useCallback((message: EditorActionMessage) => {
    if (!webviewRef.current) return console.warn("Editor isn't ready yet");

    // Workaround for https://github.com/react-native-webview/react-native-webview/issues/3305
    // On the new arch on Android, messages are sent twice, so if we toggle bold it immediately toggles back
    // We workaround this by adding a random id to the message and not handling it twice on the web side
    if (isFabric() && isAndroid) {
      message.id = Math.random().toString(36).substring(7);
    }
    webviewRef.current?.postMessage(JSON.stringify(message));
  }, []);

  const sendAction = useCallback(
    (action: any) => {
      sendMessage({
        type: EditorMessageType.Action,
        payload: action,
      });
    },
    [sendMessage]
  );

  /**
   * Injects custom css stylesheet, if stylesheet exists with the same tag, it will be replaced
   * @param cssString css to inject
   * @param tag optional - tag to identify the style element
   */
  const injectCSS = useCallback(
    (cssString: string, tag: string = 'custom-css') => {
      // Generate custom stylesheet with `custom-css` tag
      const customCSS = getStyleSheetCSS(cssString, tag);
      webviewRef.current?.injectJavaScript(customCSS);
    },
    []
  );

  // Disable color highlight on Android if not passed
  // see: https://github.com/10play/10tap-editor/issues/184
  const disableColorHighlight =
    options?.disableColorHighlight === undefined
      ? !!isAndroid
      : options?.disableColorHighlight;

  const editorBridge = useMemo(
    () => ({
      bridgeExtensions,
      initialContent: options?.initialContent,
      autofocus: options?.autofocus,
      dynamicHeight: options?.dynamicHeight,
      disableColorHighlight: disableColorHighlight,
      avoidIosKeyboard: options?.avoidIosKeyboard,
      customSource: options?.customSource,
      editable,
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
    }),
    [
      bridgeExtensions,
      options?.initialContent,
      options?.autofocus,
      options?.dynamicHeight,
      disableColorHighlight,
      options?.avoidIosKeyboard,
      options?.customSource,
      editable,
      options?.webviewBaseURL,
      options?.DEV_SERVER_URL,
      options?.DEV,
      mergedTheme,
    ]
  );

  const editorInstance = useMemo(() => {
    const instance = (bridgeExtensions || []).reduce((acc, cur) => {
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
    }, editorBridge) as EditorBridge;

    EditorHelper.setEditorLastInstance(instance);
    return instance;
  }, [bridgeExtensions, editorBridge]);

  EditorHelper.setEditorLastInstance(editorInstance);

  return editorInstance;
};

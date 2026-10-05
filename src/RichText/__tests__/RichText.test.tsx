import React, { StrictMode } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';
import {
  act,
  render,
  renderHook,
  screen,
  type RenderHookResult,
} from '@testing-library/react-native';
import { editorHtml } from '../../__mocks__/editorHtml';
import {
  mockWebViews,
  type MockWebView,
} from '../../__mocks__/react-native-webview';
import { CoreEditorActionType } from '../../bridges/core';
import { handshake, webMessage } from '../../native/__tests__/helpers';
import { CAPABILITIES } from '../../shared/capabilities';
import { EDITOR_CONTROLLER, getEditorController } from '../../shared/contracts';
import { PROTOCOL_TYPES, type ActionEnvelope } from '../../shared/protocol';
import type { EditorBridge, EditorBridgeOptions } from '../../types';
import * as misc from '../../utils/misc';
import type { KeyboardState } from '../../utils/useKeyboard';
import { RichText } from '../RichText';
import { useEditorBridge } from '../useEditorBridge';
import * as utils from '../utils';

const keyboardDown: KeyboardState = {
  systemVisible: false,
  systemHeight: 0,
  customOpen: false,
  effectiveHeight: 0,
  windowOverlaysKeyboard: true,
  isKeyboardUp: false,
  keyboardHeight: 0,
  isCustomKeyboardOpen: false,
  activeCustomKeyboardID: undefined,
  systemKeyboardHeight: 0,
  lastKeyboardHeight: 0,
};

let mockKeyboard: KeyboardState = keyboardDown;

jest.mock('../../utils/useKeyboard', () => ({
  useKeyboard: () => mockKeyboard,
}));

const keyboardUp = (height: number, overlays: boolean): KeyboardState => ({
  ...keyboardDown,
  systemVisible: true,
  systemHeight: height,
  effectiveHeight: height,
  keyboardHeight: height,
  isKeyboardUp: true,
  windowOverlaysKeyboard: overlays,
});

const controllerOf = (editor: EditorBridge) => {
  const controller = getEditorController(editor);
  if (!controller) throw new Error('editor has no controller');
  return controller;
};

const createEditor = (
  options?: EditorBridgeOptions
): RenderHookResult<EditorBridge, EditorBridgeOptions | undefined> =>
  renderHook((props) => useEditorBridge(props), { initialProps: options });

const htmlOf = (webView: MockWebView): string => {
  const source = webView.props.source;
  if (!source || !('html' in source) || typeof source.html !== 'string') {
    throw new Error('WebView has no html source');
  }
  return source.html;
};

const posted = (webView: MockWebView): ActionEnvelope['payload'][] =>
  webView.postedMessages.map(
    (data) => (JSON.parse(data) as ActionEnvelope).payload
  );

const postedTypes = (webView: MockWebView) =>
  posted(webView).map((message) => message.type);

const flatStyle = (style: unknown): ViewStyle =>
  StyleSheet.flatten(style as ViewStyle) ?? {};

const load = (webView: MockWebView) =>
  act(() => {
    webView.simulateLoadStart();
    webView.simulateLoad();
    webView.simulateLoadEnd();
  });

const ready = (webView: MockWebView, editor: EditorBridge) =>
  act(() => webView.simulateMessage(handshake(controllerOf(editor).editorId)));

const layout = (webView: MockWebView, height: number) =>
  act(() =>
    webView.props.onLayout?.({
      nativeEvent: { layout: { x: 0, y: 0, width: 320, height } },
    } as LayoutChangeEvent)
  );

const setPlatform = (os: typeof Platform.OS) =>
  jest.replaceProperty(Platform, 'OS', os);

// The old-architecture path, which hides the WebView until it loads.
beforeEach(() => {
  jest.spyOn(misc, 'isFabric').mockReturnValue(false);
});

afterEach(() => {
  mockKeyboard = keyboardDown;
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('RichText boot', () => {
  it('inlines the boot config before the first script of the editor html', () => {
    const { result } = createEditor({ initialContent: '<p>Hi</p>' });
    render(<RichText editor={result.current} />);
    const html = htmlOf(mockWebViews.latest());

    const boot = html.indexOf('window.__TENTAP__=');
    expect(boot).toBeGreaterThan(-1);
    expect(boot).toBeLessThan(html.indexOf('/* tentap editor */'));
    expect(html.indexOf('<script')).toBe(html.indexOf('<script>;(function(){'));
    expect(html).toContain(
      `"editorId":"${controllerOf(result.current).editorId}"`
    );
    expect(html).toContain(
      '"initialContent":"\\u003cp\\u003eHi\\u003c/p\\u003e"'
    );
    expect(
      mockWebViews.latest().props.injectedJavaScriptBeforeContentLoaded
    ).toBe(undefined);
  });

  it('keeps the same source while options change after mount', () => {
    const hook = createEditor({ initialContent: 'a', editable: true });
    const view = render(<RichText editor={hook.result.current} />);
    const webView = mockWebViews.latest();

    hook.rerender({ initialContent: 'b', editable: false, theme: {} });
    view.rerender(<RichText editor={hook.result.current} />);
    view.rerender(<RichText editor={hook.result.current} />);

    expect(mockWebViews.instances).toHaveLength(1);
    expect(webView.sources).toHaveLength(1);
  });

  it('loads a new page when dynamicHeight or customSource change', () => {
    const hook = createEditor();
    const view = render(<RichText editor={hook.result.current} />);

    hook.rerender({ dynamicHeight: true });
    view.rerender(<RichText editor={hook.result.current} />);
    expect(mockWebViews.instances).toHaveLength(2);
    expect(htmlOf(mockWebViews.latest())).toContain('"dynamicHeight":true');

    hook.rerender({ dynamicHeight: true, customSource: '<html>mine</html>' });
    view.rerender(<RichText editor={hook.result.current} />);
    expect(mockWebViews.instances).toHaveLength(3);
    expect(htmlOf(mockWebViews.latest())).toMatch(/^<html><script>.*mine/);
  });

  it('boots a DEV server page before content loads and again on load', () => {
    const { result } = createEditor({
      DEV: true,
      DEV_SERVER_URL: 'http://dev:3000',
    });
    render(<RichText editor={result.current} />);
    const webView = mockWebViews.latest();
    const boot = webView.props.injectedJavaScriptBeforeContentLoaded;

    expect(webView.props.source).toEqual({ uri: 'http://dev:3000' });
    expect(boot).toContain('if(window.__TENTAP__)return;');
    load(webView);
    expect(webView.injectedJavaScript).toContain(boot);
  });

  it('injects every bridge stylesheet after load', () => {
    const { result } = createEditor();
    render(<RichText editor={result.current} />);
    const script = mockWebViews.latest().props.injectedJavaScript ?? '';

    result.current.bridgeExtensions?.forEach(({ name }) =>
      expect(script).toContain(`var t=${JSON.stringify(name)}`)
    );
    expect(script.endsWith('true;')).toBe(true);
  });

  it('lets props override the WebView defaults', () => {
    const { result } = createEditor();
    render(
      <RichText
        editor={result.current}
        scrollEnabled
        injectedJavaScript="custom;"
        source={{ uri: 'https://example.com' }}
      />
    );
    const { props } = mockWebViews.latest();

    expect(props.scrollEnabled).toBe(true);
    expect(props.injectedJavaScript).toBe('custom;');
    expect(props.source).toEqual({ uri: 'https://example.com' });
    // A foreign source cannot carry the inline boot script.
    expect(props.injectedJavaScriptBeforeContentLoaded).toContain(
      'window.__TENTAP__='
    );
  });
});

describe('RichText editor prop', () => {
  it('moves to a new WebView when the editor changes', () => {
    const first = createEditor();
    const second = createEditor();
    const view = render(<RichText editor={first.result.current} />);
    const firstWebView = mockWebViews.latest();

    view.rerender(<RichText editor={second.result.current} />);
    const secondWebView = mockWebViews.latest();

    expect(secondWebView).not.toBe(firstWebView);
    expect(firstWebView.mounted).toBe(false);
    expect(htmlOf(secondWebView)).toContain(
      `"editorId":"${controllerOf(second.result.current).editorId}"`
    );
    expect(first.result.current.webviewRef.current).toBeNull();

    load(secondWebView);
    ready(secondWebView, second.result.current);
    expect(second.result.current.getEditorState().isReady).toBe(true);
    expect(first.result.current.getEditorState().isReady).toBe(false);

    second.result.current.setContent('<p>second</p>');
    expect(postedTypes(secondWebView)).toContain(
      CoreEditorActionType.SetContent
    );
  });

  it('works under StrictMode', () => {
    const { result } = renderHook(() => useEditorBridge(), {
      wrapper: StrictMode,
    });
    render(
      <StrictMode>
        <RichText editor={result.current} />
      </StrictMode>
    );
    const webView = mockWebViews.latest();

    load(webView);
    ready(webView, result.current);
    result.current.setContent('<p>strict</p>');

    expect(result.current.getEditorState().isReady).toBe(true);
    expect(postedTypes(webView)).toContain(CoreEditorActionType.SetContent);
  });
});

describe('RichText visibility and readiness', () => {
  it('hides the WebView until it loads', () => {
    const { result } = createEditor();
    render(<RichText editor={result.current} />);
    const webView = mockWebViews.latest();

    expect(flatStyle(webView.props.style).display).toBe('none');
    load(webView);
    expect(flatStyle(webView.props.style).display).toBe('flex');
  });

  it('shows the WebView at once on Fabric', () => {
    jest.spyOn(misc, 'isFabric').mockReturnValue(true);
    const { result } = createEditor();
    render(<RichText editor={result.current} />);
    const webView = mockWebViews.latest();

    expect(flatStyle(webView.props.style).display).toBe('flex');
    ready(webView, result.current);
    expect(result.current.getEditorState().isReady).toBe(true);
  });

  it('becomes ready only once the WebView is shown, then autofocuses', () => {
    const { result } = createEditor({ autofocus: true });
    render(<RichText editor={result.current} />);
    const webView = mockWebViews.latest();

    ready(webView, result.current);
    expect(result.current.getEditorState().isReady).toBe(false);
    expect(postedTypes(webView)).not.toContain(CoreEditorActionType.Focus);

    load(webView);
    expect(flatStyle(webView.props.style).display).toBe('flex');
    expect(result.current.getEditorState().isReady).toBe(true);
    expect(postedTypes(webView)).toContain(CoreEditorActionType.Focus);
  });

  it('calls the app onLoad, onLoadStart and onLoadEnd', () => {
    const onLoad = jest.fn();
    const onLoadStart = jest.fn();
    const onLoadEnd = jest.fn();
    const { result } = createEditor();
    render(
      <RichText
        editor={result.current}
        onLoad={onLoad}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
      />
    );

    load(mockWebViews.latest());

    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onLoadStart).toHaveBeenCalledTimes(1);
    expect(onLoadEnd).toHaveBeenCalledTimes(1);
  });
});

describe('RichText onMessage', () => {
  it('applies each state update once', () => {
    const { result } = createEditor();
    const editor = result.current;
    render(<RichText editor={editor} />);
    const webView = mockWebViews.latest();
    load(webView);
    ready(webView, editor);
    const listener = jest.fn();
    editor._subscribeToEditorStateUpdate(listener);

    act(() =>
      webView.simulateMessage(
        webMessage(CoreEditorActionType.StateUpdate, {
          isBoldActive: true,
          selection: { from: 1, to: 1 },
        })
      )
    );

    expect(listener).toHaveBeenCalledTimes(1);
    expect(editor.getEditorState().isBoldActive).toBe(true);
  });

  it('is visible at onLoad and ready with a custom onMessage', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const onMessage = jest.fn();
    const onChange = jest.fn();
    const { result } = createEditor({ onChange });
    render(<RichText editor={result.current} onMessage={onMessage} />);
    const webView = mockWebViews.latest();

    load(webView);
    expect(flatStyle(webView.props.style).display).toBe('flex');
    ready(webView, result.current);
    act(() =>
      webView.simulateMessage(webMessage(CoreEditorActionType.ContentUpdate))
    );

    expect(onMessage).toHaveBeenCalledTimes(2);
    expect(result.current.getEditorState().isReady).toBe(true);
    // Bridges are skipped, as in 1.0.
    expect(onChange).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('exclusivelyUseCustomOnMessage');
  });

  it('dispatches to bridges when exclusivelyUseCustomOnMessage is false', () => {
    const onMessage = jest.fn();
    const onChange = jest.fn();
    const { result } = createEditor({ onChange });
    render(
      <RichText
        editor={result.current}
        onMessage={onMessage}
        exclusivelyUseCustomOnMessage={false}
      />
    );
    const webView = mockWebViews.latest();
    load(webView);

    act(() =>
      webView.simulateMessage(webMessage(CoreEditorActionType.ContentUpdate))
    );

    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('ignores messages of another editor and non-JSON data', () => {
    const onChange = jest.fn();
    const { result } = createEditor({ onChange });
    render(<RichText editor={result.current} />);
    const webView = mockWebViews.latest();
    load(webView);

    act(() => {
      webView.simulateMessage(
        webMessage(CoreEditorActionType.ContentUpdate, undefined, 'other')
      );
      webView.simulateMessage('not json');
    });

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('RichText dynamic height', () => {
  const render100 = (
    options: EditorBridgeOptions,
    props: Partial<React.ComponentProps<typeof RichText>> = {}
  ) => {
    const { result } = createEditor({ dynamicHeight: true, ...options });
    render(<RichText editor={result.current} {...props} />);
    const webView = mockWebViews.latest();
    load(webView);
    act(() =>
      webView.simulateMessage(webMessage(PROTOCOL_TYPES.DocumentHeight, 100))
    );
    return { editor: result.current, webView };
  };

  it('sizes the container by its height, resetting flex, last (#342)', () => {
    const { webView } = render100(
      { theme: { webviewContainer: { flex: 1 } } },
      { containerStyle: { flex: 1, maxHeight: 300 } }
    );

    // A `flex: 1` left in place starts Yoga from a basis of 0, and on Fabric
    // the editor stays collapsed inside a capped parent (#289, #323).
    const containerStyle = flatStyle(webView.props.containerStyle);
    expect(containerStyle).toMatchObject({
      flex: 0,
      flexShrink: 1,
      maxHeight: 300,
      height: 100,
    });
    expect(containerStyle).not.toHaveProperty('flexBasis');
    expect(containerStyle).not.toHaveProperty('flexGrow');
  });

  it('keeps the height across RichText remounts', () => {
    const { editor } = render100({});
    render(<RichText editor={editor} />);

    expect(flatStyle(mockWebViews.latest().props.containerStyle).height).toBe(
      100
    );
  });

  it('also sizes the WebView itself on web (#205)', () => {
    setPlatform('web');
    const { webView } = render100({});

    // CSS `flex: 0` would mean a 0% basis, so web keeps the longhands.
    expect(flatStyle(webView.props.style)).toMatchObject({
      height: 100,
      flexBasis: 100,
      flexGrow: 0,
      flexShrink: 1,
    });
    expect(flatStyle(webView.props.containerStyle)).not.toHaveProperty('flex');
  });

  it('reports the container height to the web (#323)', () => {
    const { editor, webView } = render100({});
    layout(webView, 240);
    ready(webView, editor);

    expect(posted(webView)).toContainEqual({
      type: PROTOCOL_TYPES.ContainerHeight,
      payload: 240,
    });
  });

  it('reports no container height without dynamicHeight', () => {
    const { result } = createEditor();
    render(<RichText editor={result.current} />);
    const webView = mockWebViews.latest();
    load(webView);
    layout(webView, 240);
    act(() =>
      webView.simulateMessage(
        handshake(controllerOf(result.current).editorId, [
          CAPABILITIES.ContainerHeight,
        ])
      )
    );

    expect(postedTypes(webView)).not.toContain(PROTOCOL_TYPES.ContainerHeight);
  });
});

describe('RichText styles', () => {
  const appStyles = StyleSheet.create({
    webview: { backgroundColor: 'red' },
    container: { margin: 4 },
  });

  it('replaces the default style with the app style, as in 1.0', () => {
    const { result } = createEditor();
    render(<RichText editor={result.current} style={appStyles.webview} />);

    expect(flatStyle(mockWebViews.latest().props.style)).toEqual({
      backgroundColor: 'red',
    });
  });

  it('merges the app style over the defaults with mergeStyles', () => {
    const { result } = createEditor({ mergeStyles: true });
    render(
      <RichText
        editor={result.current}
        style={appStyles.webview}
        containerStyle={appStyles.container}
      />
    );
    const { props } = mockWebViews.latest();

    expect(flatStyle(props.style)).toMatchObject({
      flex: 1,
      display: 'none',
      backgroundColor: 'red',
    });
    expect(flatStyle(props.containerStyle)).toEqual({ margin: 4 });
  });

  it('renders a focusable hidden input for Android autofocus (#321)', () => {
    setPlatform('android');
    const { result } = createEditor({ autofocus: true });
    render(<RichText editor={result.current} />);
    const input = screen.UNSAFE_getByType(TextInput);

    expect(input.props.autoFocus).toBe(true);
    expect(input.props.caretHidden).toBe(true);
    expect(flatStyle(input.props.style)).toEqual({
      position: 'absolute',
      top: 0,
      left: 0,
      width: 1,
      height: 1,
      opacity: 0,
      pointerEvents: 'none',
    });
  });

  describe('Android autofocus keyboard (#321)', () => {
    const autofocused = () => {
      setPlatform('android');
      jest.useFakeTimers();
      const { result } = createEditor({ autofocus: true });
      render(<RichText editor={result.current} />);
      const input = screen.UNSAFE_getByType(TextInput);
      const instance = input.instance as TextInput;
      const focusInput = jest.spyOn(instance, 'focus').mockClear();
      const blurInput = jest.spyOn(instance, 'blur').mockClear();
      const webView = mockWebViews.latest();
      load(webView);
      ready(webView, result.current);
      const focusCount = () =>
        postedTypes(webView).filter(
          (type) => type === CoreEditorActionType.Focus
        ).length;
      expect(focusCount()).toBe(1);
      return { instance, focusInput, blurInput, focusCount };
    };

    it('shows the IME again when it did not come up', () => {
      const { focusInput, focusCount } = autofocused();

      act(() => jest.advanceTimersByTime(utils.AUTOFOCUS_KEYBOARD_CHECK_MS));
      expect(focusInput).toHaveBeenCalledTimes(1);
      act(() => jest.advanceTimersByTime(50));
      expect(focusCount()).toBe(2);
    });

    it('refocuses the hidden input when it kept focus without the IME', () => {
      const { instance, focusInput, blurInput, focusCount } = autofocused();
      jest
        .spyOn(TextInput.State, 'currentlyFocusedInput')
        .mockReturnValue(instance as never);

      act(() => jest.advanceTimersByTime(utils.AUTOFOCUS_KEYBOARD_CHECK_MS));
      expect(blurInput).toHaveBeenCalledTimes(1);
      expect(focusInput).toHaveBeenCalledTimes(1);
      expect(blurInput.mock.invocationCallOrder[0]).toBeLessThan(
        focusInput.mock.invocationCallOrder[0]!
      );
      act(() => jest.advanceTimersByTime(50));
      expect(focusCount()).toBe(2);
    });

    it('leaves the IME to another focused input', () => {
      const { focusInput, focusCount } = autofocused();
      jest
        .spyOn(TextInput.State, 'currentlyFocusedInput')
        .mockReturnValue({} as never);

      act(() => jest.runAllTimers());
      expect(focusInput).not.toHaveBeenCalled();
      expect(focusCount()).toBe(1);
    });

    it('leaves a keyboard that came up alone', () => {
      mockKeyboard = keyboardUp(300, false);
      const { focusInput, focusCount } = autofocused();

      act(() => jest.runAllTimers());
      expect(focusInput).not.toHaveBeenCalled();
      expect(focusCount()).toBe(1);
    });
  });

  it('renders no hidden input on iOS', () => {
    const { result } = createEditor({ autofocus: true });
    render(<RichText editor={result.current} />);

    expect(screen.UNSAFE_queryByType(TextInput)).toBeNull();
  });
});

describe('RichText keyboard insets', () => {
  const thresholds = (webView: MockWebView) =>
    posted(webView)
      .filter(
        ({ type }) =>
          type === CoreEditorActionType.UpdateScrollThresholdAndMargin
      )
      .map(({ payload }) => payload);

  const paddingScripts = (webView: MockWebView) =>
    webView.injectedJavaScript.filter((script) =>
      script.includes('paddingBottom')
    );

  const mountReady = (options: EditorBridgeOptions) => {
    const hook = createEditor(options);
    const view = render(<RichText editor={hook.result.current} />);
    const webView = mockWebViews.latest();
    load(webView);
    ready(webView, hook.result.current);
    return {
      webView,
      update: (keyboard: KeyboardState) => {
        mockKeyboard = keyboard;
        view.rerender(<RichText editor={hook.result.current} />);
      },
    };
  };

  it('pads by the keyboard height where it overlays the window', () => {
    const { webView, update } = mountReady({ avoidIosKeyboard: true });
    expect(thresholds(webView)).toEqual([]);

    update(keyboardUp(300, true));
    update(keyboardDown);

    expect(thresholds(webView)).toEqual([310, 0]);
    expect(paddingScripts(webView)).toEqual([
      utils.buildBottomPaddingScript(310),
      utils.buildBottomPaddingScript(0),
    ]);
  });

  it('adds scrollBottomOffset, also without avoidKeyboard (#308)', () => {
    const { webView, update } = mountReady({ scrollBottomOffset: 50 });
    update(keyboardUp(300, true));

    expect(thresholds(webView)).toEqual([50]);
  });

  it('pads nothing in dynamic-height mode (#336)', () => {
    const { webView, update } = mountReady({
      avoidKeyboard: true,
      dynamicHeight: true,
    });
    update(keyboardUp(300, true));

    expect(paddingScripts(webView)).toEqual([]);
    expect(thresholds(webView)).toEqual([]);
  });

  it('waits for the Android window resize and cancels on unmount (#299)', () => {
    setPlatform('android');
    jest.useFakeTimers();
    const hook = createEditor({ avoidKeyboard: true });
    mockKeyboard = keyboardUp(300, false);
    const view = render(<RichText editor={hook.result.current} />);
    const webView = mockWebViews.latest();
    load(webView);
    ready(webView, hook.result.current);

    act(() => jest.advanceTimersByTime(199));
    expect(thresholds(webView)).toEqual([]);
    act(() => jest.advanceTimersByTime(1));
    expect(thresholds(webView)).toEqual([utils.TOOLBAR_HEIGHT]);

    mockKeyboard = { ...keyboardDown, windowOverlaysKeyboard: false };
    view.rerender(<RichText editor={hook.result.current} />);
    expect(thresholds(webView)).toEqual([utils.TOOLBAR_HEIGHT]);
    view.unmount();
    act(() => jest.runAllTimers());
    expect(thresholds(webView)).toEqual([utils.TOOLBAR_HEIGHT]);
  });

  it('clears insets left by an unmounted RichText of the same editor', () => {
    const hook = createEditor({ avoidIosKeyboard: true });
    mockKeyboard = keyboardUp(300, true);
    const first = render(<RichText editor={hook.result.current} />);
    load(mockWebViews.latest());
    ready(mockWebViews.latest(), hook.result.current);
    first.unmount();

    mockKeyboard = keyboardDown;
    render(<RichText editor={hook.result.current} />);
    const webView = mockWebViews.latest();
    load(webView);
    ready(webView, hook.result.current);

    expect(paddingScripts(webView).at(-1)).toBe(
      utils.buildBottomPaddingScript(0)
    );
    expect(thresholds(webView).at(-1)).toBe(0);
  });

  it('re-applies the padding after a reload', () => {
    const hook = createEditor({ avoidIosKeyboard: true });
    mockKeyboard = keyboardUp(300, true);
    render(<RichText editor={hook.result.current} />);
    const webView = mockWebViews.latest();
    load(webView);
    ready(webView, hook.result.current);
    const before = paddingScripts(webView).length;

    load(webView);
    ready(webView, hook.result.current);

    expect(paddingScripts(webView).length).toBe(before + 1);
    expect(thresholds(webView)).toEqual([310, 310]);
  });
});

describe('RichText lifecycle', () => {
  it('stays ready on web while react-native-web-webview replaces its handle', () => {
    setPlatform('web');
    mockWebViews.newHandleEveryRender = true;
    const { result } = createEditor();
    const editor = result.current;
    const { rerender } = render(<RichText editor={editor} />);
    const webView = mockWebViews.latest();
    load(webView);
    ready(webView, editor);

    rerender(<RichText editor={editor} testID="rerendered" />);
    editor.setContent('<p>after</p>');
    editor.webviewRef.current?.injectJavaScript('true;');

    expect(editor.getEditorState().isReady).toBe(true);
    expect(postedTypes(webView)).toContain(CoreEditorActionType.SetContent);
    expect(webView.injectedJavaScript).toContain('true;');
  });

  it('remounts the first WebView on affected iOS versions', () => {
    jest.spyOn(utils, 'shouldRemountOnFirstLoad').mockReturnValue(true);
    const { result } = createEditor();
    const editor = result.current;
    render(<RichText editor={editor} />);
    const first = mockWebViews.latest();

    editor.setContent('<p>queued</p>');
    ready(first, editor);
    load(first);
    expect(editor.getEditorState().isReady).toBe(false);
    expect(first.postedMessages).toEqual([]);

    const second = mockWebViews.latest();
    expect(second).not.toBe(first);
    expect(second.props.source).toBe(first.props.source);
    expect(flatStyle(second.props.style).display).toBe('flex');

    load(second);
    ready(second, editor);
    expect(editor.getEditorState().isReady).toBe(true);
    expect(postedTypes(second)).toContain(CoreEditorActionType.SetContent);
    expect(mockWebViews.instances).toHaveLength(2);
  });

  it('mounts a new WebView when the Android renderer is gone', () => {
    const onRenderProcessGone = jest.fn();
    const { result } = createEditor();
    const editor = result.current;
    render(
      <RichText editor={editor} onRenderProcessGone={onRenderProcessGone} />
    );
    const first = mockWebViews.latest();
    load(first);
    ready(first, editor);
    editor.setContent('<p>kept</p>');

    act(() => first.simulateRenderProcessGone());
    const second = mockWebViews.latest();

    expect(onRenderProcessGone).toHaveBeenCalledTimes(1);
    expect(second).not.toBe(first);
    expect(editor.getEditorState().isReady).toBe(false);
    load(second);
    ready(second, editor);
    expect(posted(second)).toContainEqual(
      expect.objectContaining({ type: CoreEditorActionType.SetContent })
    );
  });

  it('reloads the WebView when the iOS content process terminates', () => {
    const onContentProcessDidTerminate = jest.fn();
    const { result } = createEditor();
    render(
      <RichText
        editor={result.current}
        onContentProcessDidTerminate={onContentProcessDidTerminate}
      />
    );
    const webView = mockWebViews.latest();
    load(webView);
    ready(webView, result.current);

    act(() => webView.simulateContentProcessDidTerminate());

    expect(webView.reloadCount).toBe(1);
    expect(result.current.getEditorState().isReady).toBe(false);
    expect(onContentProcessDidTerminate).toHaveBeenCalledTimes(1);
  });

  it('accepts a spread copy of the editor, as 1.0 did', () => {
    const { result } = createEditor();
    const copy: EditorBridge = { ...result.current };
    render(<RichText editor={copy} />);
    const webView = mockWebViews.latest();
    load(webView);
    ready(webView, result.current);

    expect(result.current.getEditorState().isReady).toBe(true);
    expect(copy.webviewRef.current).toBe(result.current.webviewRef.current);
    act(() => copy.setContent('<p>from the copy</p>'));
    expect(posted(webView)).toContainEqual(
      expect.objectContaining({ type: CoreEditorActionType.SetContent })
    );
  });

  it('throws a clear error for an editor without a controller', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = createEditor();
    const detached = { ...result.current };
    Reflect.deleteProperty(detached, EDITOR_CONTROLLER);

    expect(() => render(<RichText editor={detached} />)).toThrow(
      /useEditorBridge/
    );
  });
});

describe('RichText utils', () => {
  it('detects the react-native-webview versions that need a remount', () => {
    expect(utils.requiresIosRemount('13.12.2')).toBe(false);
    expect(utils.requiresIosRemount('13.12.3')).toBe(true);
    expect(utils.requiresIosRemount('13.12.4')).toBe(true);
    expect(utils.requiresIosRemount('13.12.5')).toBe(false);
    expect(utils.requiresIosRemount('13.12.40')).toBe(false);
    expect(utils.requiresIosRemount('13.16.0')).toBe(false);
    expect(utils.requiresIosRemount(undefined)).toBe(false);
  });

  it('reads the installed react-native-webview version', () => {
    expect(utils.getWebViewVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('sets the 1.0 window globals with getInjectedJSBeforeContentLoad', () => {
    const { result } = createEditor({
      initialContent: "<p>it's `${quoted}`</p>",
      editable: false,
    });
    const window: Record<string, unknown> = {};

    new Function(
      'window',
      utils.getInjectedJSBeforeContentLoad(result.current)
    )(window);

    expect(window).toMatchObject({
      initialContent: "<p>it's `${quoted}`</p>",
      editable: false,
      contentInjected: true,
      platform: 'ios',
      dynamicHeight: false,
    });
    // Plus the `history` alias that 0.7.x bundles filter HistoryBridge by.
    expect(window.whiteListBridgeExtensions).toEqual([
      ...(result.current.bridgeExtensions ?? []).map(({ name }) => name),
      'history',
    ]);
    expect(
      JSON.parse(window.bridgeExtensionConfigMap as string)
    ).toHaveProperty('history');
  });

  it('computes keyboard insets', () => {
    const base = {
      platform: 'ios',
      avoidKeyboard: true,
      dynamicHeight: false,
      scrollBottomOffset: undefined,
      isKeyboardUp: true,
      keyboardHeight: 300,
      windowOverlaysKeyboard: true,
    };
    expect(utils.getKeyboardInsets(base)).toEqual({
      padding: 310,
      scrollThreshold: 310,
    });
    expect(
      utils.getKeyboardInsets({
        ...base,
        platform: 'android',
        windowOverlaysKeyboard: false,
      })
    ).toEqual({ padding: 44, scrollThreshold: 44 });
    expect(
      utils.getKeyboardInsets({ ...base, avoidKeyboard: false })
    ).toBeNull();
    expect(
      utils.getKeyboardInsets({
        ...base,
        platform: 'web',
        scrollBottomOffset: 8,
      })
    ).toEqual({ padding: 8, scrollThreshold: 8 });
  });

  it('keeps the editor html untouched apart from the boot script', () => {
    const { result } = createEditor();
    render(<RichText editor={result.current} />);

    expect(
      htmlOf(mockWebViews.latest()).replace(
        /<script>;\(function.*?<\/script>/,
        ''
      )
    ).toBe(editorHtml);
  });
});

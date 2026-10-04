import React from 'react';
import { StyleSheet } from 'react-native';
import { act, render, renderHook, screen } from '@testing-library/react-native';
import { RichText, useEditorBridge } from '../index';
import { editorHtml } from '../__mocks__/editorHtml';
import { mockWebViews } from '../__mocks__/react-native-webview';

const renderEditor = (options?: Parameters<typeof useEditorBridge>[0]) => {
  const { result } = renderHook(() => useEditorBridge(options));
  const editor = result.current;
  render(<RichText editor={editor} />);
  return { editor, webView: mockWebViews.latest() };
};

describe('react-native-webview mock', () => {
  it('records the source the editor is loaded with', () => {
    const { webView } = renderEditor();

    expect(webView.mounted).toBe(true);
    expect(webView.sources).toHaveLength(1);
    // RichText inlines its boot script into the editor HTML.
    const { html } = webView.sources[0] as { html: string };
    expect(html.replace(/<script>;\(function\(\)\{.*?<\/script>/, '')).toBe(
      editorHtml
    );
  });

  it('exposes the imperative handle through the editor webviewRef', () => {
    const { editor, webView } = renderEditor();

    editor.webviewRef.current?.injectJavaScript('window.injected = true;');

    expect(webView.injectedJavaScript).toEqual(['window.injected = true;']);
  });

  it('delivers simulated web messages to the WebView props', () => {
    const { webView } = renderEditor({ dynamicHeight: true });

    act(() => {
      webView.simulateMessage({ type: 'document-height', payload: 120 });
    });

    expect(screen.getByTestId('webview')).toBeOnTheScreen();
    expect(StyleSheet.flatten(webView.props.containerStyle)).toMatchObject({
      height: 120,
    });
  });

  it('simulates lifecycle events', () => {
    const { result } = renderHook(() => useEditorBridge());
    const onLoad = jest.fn();
    const onRenderProcessGone = jest.fn();
    render(
      <RichText
        editor={result.current}
        onLoad={onLoad}
        onRenderProcessGone={onRenderProcessGone}
      />
    );
    const webView = mockWebViews.latest();

    act(() => {
      webView.simulateLoad();
      webView.simulateRenderProcessGone();
    });

    expect(onLoad).toHaveBeenCalledWith(
      expect.objectContaining({
        nativeEvent: expect.objectContaining({ loading: false }),
      })
    );
    expect(onRenderProcessGone).toHaveBeenCalledWith(
      expect.objectContaining({ nativeEvent: { didCrash: true } })
    );
  });
});

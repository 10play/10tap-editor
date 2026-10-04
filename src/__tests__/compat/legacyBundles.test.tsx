import React from 'react';
import { render, renderHook, waitFor } from '@testing-library/react-native';
import { RichText, useEditorBridge, type EditorBridge } from '../../index';
import { connectWebViews, type WebViewConnection } from './connectWebView';
import {
  LEGACY_VERSIONS,
  readLegacyHtml,
  type LegacyVersion,
} from './legacyBundle';

/**
 * 1.1 native talking to the real 1.0.1 / 0.7.x web bundles through the public
 * API only: apps that ship a custom bundle built from those templates must
 * keep working after upgrading the package.
 */

let connection: WebViewConnection | undefined;

const mountEditor = (
  version: LegacyVersion,
  options: Parameters<typeof useEditorBridge>[0] = {}
): EditorBridge => {
  const { result } = renderHook(() =>
    useEditorBridge({
      customSource: readLegacyHtml(version),
      initialContent: '<p>Hello TenTap</p>',
      ...options,
    })
  );
  render(<RichText editor={result.current} />);
  connection = connectWebViews();
  return result.current;
};

const waitForReady = (editor: EditorBridge) =>
  waitFor(() => expect(editor.getEditorState().isReady).toBe(true), {
    timeout: 5000,
  });

afterEach(() => {
  connection?.disconnect();
  connection = undefined;
});

const defineLegacySuite = (version: LegacyVersion) => {
  it('becomes ready', async () => {
    const editor = mountEditor(version);

    await waitForReady(editor);
    expect(editor.getEditorState()).toMatchObject({ editable: true });
  });

  it('becomes ready when not editable (#322)', async () => {
    const editor = mountEditor(version, { editable: false });

    await waitForReady(editor);
    expect(editor.getEditorState().editable).toBe(false);
  });

  it('reads and replaces content', async () => {
    const editor = mountEditor(version);
    await waitForReady(editor);

    expect(await editor.getHTML()).toBe('<p>Hello TenTap</p>');
    editor.setContent('<p>Replaced</p>');
    expect(await editor.getHTML()).toBe('<p>Replaced</p>');
    expect(await editor.getText()).toBe('Replaced');
  });

  it('runs bridge commands', async () => {
    const editor = mountEditor(version);
    await waitForReady(editor);

    editor.focus('all');
    editor.toggleBold();

    expect(await editor.getHTML()).toBe('<p><strong>Hello TenTap</strong></p>');
  });

  it('applies injected CSS', async () => {
    const editor = mountEditor(version);
    await waitForReady(editor);

    editor.injectCSS('p { color: red; }', 'compat-css');

    await waitFor(() =>
      expect(
        connection?.page?.window.document.querySelector(
          'style[data-tag="compat-css"]'
        )?.textContent
      ).toBe('p { color: red; }')
    );
  });
};

describe('native with the legacy 0.7.5-alpha.0 bundle', () => {
  defineLegacySuite('0.7.5-alpha.0');
});

// The 1.0.1 bundle never sends an initial stateUpdate (#343); native falls
// back to legacy readiness after onLoadEnd.
describe('native with the legacy 1.0.1 bundle', () => {
  defineLegacySuite('1.0.1');
});

// Commands sent before ready are queued, not dropped (#299, #227).
describe.each(LEGACY_VERSIONS)(
  'native queueing for the legacy %s bundle',
  (version) => {
    it('delivers commands issued before the bundle is ready', async () => {
      const editor = mountEditor(version);
      editor.setContent('<p>Early</p>');

      await waitForReady(editor);
      expect(await editor.getHTML()).toBe('<p>Early</p>');
    });
  }
);

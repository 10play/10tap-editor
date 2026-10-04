import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { EditorContent } from '@tiptap/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TenTapStartKit, useTenTap } from '../webEditorUtils';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

const Editor = () => {
  const editor = useTenTap({ bridges: TenTapStartKit });
  return <EditorContent editor={editor} />;
};

describe('web editor environment (jsdom)', () => {
  const postMessage = vi.fn<(message: string) => void>();
  let container: HTMLDivElement;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    window.ReactNativeWebView = { postMessage };
    window.initialContent = '<p>Hello TenTap</p>';
    window.bridgeExtensionConfigMap = JSON.stringify(
      Object.fromEntries(
        TenTapStartKit.map((bridge) => [
          bridge.name,
          { optionsConfig: bridge.config, extendConfig: bridge.extendConfig },
        ])
      )
    );
  });

  afterEach(() => {
    container.remove();
  });

  it('boots the tiptap editor with the starter kit bridges', async () => {
    const root = createRoot(container);
    await act(async () => root.render(<Editor />));

    expect(container.querySelector('.ProseMirror')?.textContent).toBe(
      'Hello TenTap'
    );
    await vi.waitFor(() => {
      const types = postMessage.mock.calls.map(
        ([message]) => (JSON.parse(message) as { type: string }).type
      );
      expect(types).toContain('editor-ready');
    });

    await act(async () => root.unmount());
  });
});

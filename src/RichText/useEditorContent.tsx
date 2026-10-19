import debounce from 'lodash/debounce';
import { useEffect, useState } from 'react';
import type { EditorContentType } from '../bridges/core';
import { getEditorController } from '../shared/contracts';
import type { EditorBridge } from '../types';

interface Options<T extends EditorContentType> {
  type?: T;
  debounceInterval?: number;
}
const DEFAULT_OPTIONS: Required<Options<'html'>> = {
  type: 'html',
  debounceInterval: 10,
};

type ContentType<T extends EditorContentType> = T extends 'json'
  ? object
  : string;

/**
 * The editor's content, fetched when the editor becomes ready and after every
 * content change (debounced). Selection changes don't fetch, except with
 * legacy bundles: a 1.0 bundle whose `tiptapOptions.onUpdate` replaced the
 * protocol handler never sends `content-update`, so every state update
 * fetches, as in 1.0.
 */
export function useEditorContent<T extends EditorContentType>(
  editor: EditorBridge,
  { debounceInterval, type }: Options<T> = DEFAULT_OPTIONS as Options<T>
): ContentType<T> | undefined {
  const [content, setContent] = useState<ContentType<T>>();

  useEffect(() => {
    let active = true;
    let latestRequest = 0;

    const read = (): Promise<string | object> => {
      switch (type) {
        case 'json':
          return editor.getJSON();
        case 'text':
          return editor.getText();
        default:
          return editor.getHTML();
      }
    };

    const fetchContent = debounce(() => {
      const request = ++latestRequest;
      const version = getEditorController(editor)?.getContentVersion();
      read().then(
        (value) => {
          // A newer request was sent while this one was in flight.
          if (!active || request !== latestRequest) return;
          // Text loses formatting, so only HTML and JSON can restore the document.
          if (type !== 'text') {
            getEditorController(editor)?.rememberContent(value, version);
          }
          setContent(value as ContentType<T>);
        },
        // Timeouts and unsupported bundles: the next change fetches again.
        () => {}
      );
    }, debounceInterval);

    let ready = editor.getEditorState().isReady === true;
    if (ready) fetchContent();
    const unsubscribeState = editor._subscribeToEditorStateUpdate((state) => {
      const next = state.isReady === true;
      const legacy = getEditorController(editor)?.getCapabilities().legacy;
      if (next && (!ready || legacy)) fetchContent();
      ready = next;
    });
    const unsubscribeContent = editor._subscribeToContentUpdate(() =>
      fetchContent()
    );

    return () => {
      active = false;
      fetchContent.cancel();
      unsubscribeState();
      unsubscribeContent();
    };
  }, [editor, debounceInterval, type]);

  return content;
}

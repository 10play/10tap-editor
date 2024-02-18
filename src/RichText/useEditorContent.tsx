import debounce from 'lodash/debounce';
import type { EditorBridge } from '../types';
import { useEffect, useState } from 'react';
import type { EditorContentType } from '../bridges/core';

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

export function useEditorContent<T extends EditorContentType>(
  editor: EditorBridge,
  { debounceInterval, type }: Options<T> = DEFAULT_OPTIONS as Options<T>
) {
  const [content, setContent] = useState<ContentType<T>>();

  useEffect(() => {
    const updateContent = debounce(async () => {
      switch (type) {
        case 'json':
          const json = await editor.getJSON();
          setContent(json as ContentType<T>);
          break;
        case 'text':
          const text = await editor.getText();
          setContent(text as ContentType<T>);
          break;
        case 'html':
        default:
          const html = await editor.getHTML();
          setContent(html as ContentType<T>);
          break;
      }
    }, debounceInterval);

    const unsubscribe = editor._subscribeToEditorStateUpdate(() => {
      updateContent();
    });

    return () => {
      unsubscribe();
    };
  }, [editor, debounceInterval, type]);

  return content;
}

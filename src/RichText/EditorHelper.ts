import { useState } from 'react';
import type { EditorBridge } from '../types';
import type { Subscription } from '../types/Subscription';

class _EditorHelper {
  editorLastInstance: EditorBridge | undefined;
  cbs: ((editor: EditorBridge | undefined) => void)[] = [];

  constructor() {
    this.editorLastInstance = undefined;
  }

  setEditorLastInstance(editorLastInstance: EditorBridge) {
    this.editorLastInstance = editorLastInstance;
    this.cbs.forEach((cb) => {
      cb(editorLastInstance);
    });
  }

  subscribe: Subscription<EditorBridge | undefined> = (cb) => {
    this.cbs.push(cb);
    return () => {
      this.cbs = this.cbs.filter((sub) => sub !== cb);
    };
  };
}

export const EditorHelper = new _EditorHelper();

export const useRemoteEditorBridge = () => {
  const [editor, _setEditor] = useState<EditorBridge | undefined>(
    EditorHelper.editorLastInstance
  );

  // TODO -
  // There is currently a bug on ios where the keyboard isn't unmounted RCTRootView isn't unmounted
  // When removed from subview, because of this we can't rely on it to unsubscribe. Once this is fixed we can
  // add this again make it be reactive
  // useEffect(() => {
  //   const unsubscribe = EditorHelper.subscribe((editor) => {
  //     setEditor(editor);
  //   });

  //   return () => {
  //     unsubscribe();
  //   };
  // }, []);

  return editor;
};

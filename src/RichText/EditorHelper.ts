import { useSyncExternalStore } from 'react';
import type { EditorBridge } from '../types';
import type { Subscription } from '../types/Subscription';

/**
 * Tracks the mounted editors so code outside the editor's component (custom
 * keyboards, toolbars rendered elsewhere) can reach one. Editors are kept in
 * mount order: when the last one unmounts, the previous one becomes current
 * again instead of leaving `undefined` (or a stale editor) behind.
 */
class _EditorHelper {
  /** The most recently mounted editor that is still mounted. */
  editorLastInstance: EditorBridge | undefined;
  cbs: ((editor: EditorBridge | undefined) => void)[] = [];
  private readonly instances: EditorBridge[] = [];

  constructor() {
    this.editorLastInstance = undefined;
  }

  /** Makes `editorLastInstance` the given editor. `useEditorBridge` calls it on mount. */
  setEditorLastInstance(editorLastInstance: EditorBridge) {
    this.remove(editorLastInstance);
    this.instances.push(editorLastInstance);
    this.update();
  }

  /** Forgets an editor. `useEditorBridge` calls it on unmount. */
  removeEditorInstance(editor: EditorBridge) {
    this.remove(editor);
    this.update();
  }

  subscribe: Subscription<EditorBridge | undefined> = (cb) => {
    this.cbs.push(cb);
    return () => {
      this.cbs = this.cbs.filter((sub) => sub !== cb);
    };
  };

  private remove(editor: EditorBridge) {
    const index = this.instances.indexOf(editor);
    if (index !== -1) this.instances.splice(index, 1);
  }

  private update() {
    const current = this.instances[this.instances.length - 1];
    if (current === this.editorLastInstance) return;
    this.editorLastInstance = current;
    this.cbs.forEach((cb) => {
      cb(current);
    });
  }
}

export const EditorHelper = new _EditorHelper();

const getLastInstance = () => EditorHelper.editorLastInstance;

/** The most recently mounted editor; re-renders when it changes (#51). */
export const useRemoteEditorBridge = (): EditorBridge | undefined =>
  useSyncExternalStore(
    EditorHelper.subscribe,
    getLastInstance,
    getLastInstance
  );

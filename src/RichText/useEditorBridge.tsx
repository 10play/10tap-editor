import { useEffect, useRef, useState } from 'react';
import type { EditorBridge, EditorBridgeOptions } from '../types';
import { EditorHelper } from './EditorHelper';
import { createEditorFacade } from './editorFacade';

export type { RecursivePartial } from '../types/utility';

/**
 * Creates the editor. The returned object keeps its identity for the life of
 * the component, so it is safe in dependency arrays; its option fields
 * (`theme`, `dynamicHeight`, …) always reflect the latest render.
 */
export const useEditorBridge = (
  options?: EditorBridgeOptions
): EditorBridge => {
  const [{ editor, controller, setOptions }] = useState(() => {
    const facade = createEditorFacade(options);
    // As in 1.0, code later in the same render can already read it.
    // Subscribers are told once it mounts.
    EditorHelper.editorLastInstance = facade.editor;
    return facade;
  });
  setOptions(options);

  // Reversible, so a StrictMode remount keeps a working editor.
  useEffect(() => {
    controller.attach();
    EditorHelper.setEditorLastInstance(editor);
    return () => {
      EditorHelper.removeEditorInstance(editor);
      controller.detach();
    };
  }, [controller, editor]);

  // The initial value is part of the boot config; only changes are sent.
  const editable = options?.editable ?? true;
  const sentEditable = useRef(editable);
  useEffect(() => {
    if (sentEditable.current === editable) return;
    sentEditable.current = editable;
    editor.setEditable?.(editable);
    controller.setState({ ...controller.getState(), editable });
  }, [controller, editable, editor]);

  return editor;
};

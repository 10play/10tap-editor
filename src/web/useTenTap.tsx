import { useEffect, useState } from 'react';
import { useEditor } from '@tiptap/react';
import type { AnyExtension, Editor, EditorEvents } from '@tiptap/core';
import type BridgeExtension from '../bridges/base';
import { CoreEditorActionType } from '../bridges/core';
import { blueBackgroundPlugin } from '../bridges/HighlightSelection';
import type { BootConfig } from '../shared/bootConfig';
import { PROTOCOL_TYPES, type BridgeMessage } from '../shared/protocol';
import { DynamicHeight, createDynamicHeightExtension } from './dynamicHeight';
import { resolveBridgeExtensions, selectActiveBridges } from './extensions';
import { boot, type WebRuntime } from './runtime';
import { createStatePublisher, type StatePublisher } from './statePublisher';
import {
  DYNAMIC_HEIGHT_CSS,
  DYNAMIC_HEIGHT_STYLE_TAG,
  applyStyleSheet,
} from './styles';

export interface UseTenTapArgs {
  /**
   * Options for TipTap's `useEditor`. `extensions` are added after the bridge
   * extensions. `onUpdate`, `onSelectionUpdate` and `onTransaction` run after
   * the protocol handlers instead of replacing them, and `onCreate` no longer
   * affects `editor-ready`. Every other option (`content`, `editable`,
   * `editorProps`, …) overrides the default. Untyped, as in 1.0.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tiptapOptions?: any;
  /** Bridges the bundle supports; only those the native side uses are loaded. */
  bridges?: BridgeExtension[];
  /** Debounce of `stateUpdate` messages after the initial one. Default 10. */
  stateUpdateDebounceMs?: number;
}

interface EditorSetup {
  runtime: WebRuntime;
  config: BootConfig;
  bridges: BridgeExtension[];
  extensions: AnyExtension[];
  dynamicHeight: DynamicHeight;
  /** Applies `set-dynamic-height`; set while the hook is mounted. */
  setDynamicHeight?: (enabled: boolean) => void;
  publisher: StatePublisher;
  /** Editors that already sent `editor-ready`. */
  announced: WeakSet<Editor>;
}

/** Resolved once per hook: later changes to `bridges` are ignored (#309). */
function createEditorSetup(
  bridges: readonly BridgeExtension[],
  stateUpdateDebounceMs: number | undefined
): EditorSetup {
  const runtime = boot();
  const config = runtime.requireConfig();
  const active = selectActiveBridges(bridges, config);
  const dynamicHeight = new DynamicHeight({
    onHeight: (height) =>
      runtime.post({ type: PROTOCOL_TYPES.DocumentHeight, payload: height }),
  });
  return {
    runtime,
    config,
    bridges: active,
    extensions: [
      ...(config.disableColorHighlight ? [] : [blueBackgroundPlugin]),
      ...resolveBridgeExtensions(active, config),
      createDynamicHeightExtension(dynamicHeight),
    ],
    dynamicHeight,
    publisher: createStatePublisher(
      runtime.post,
      () => active,
      stateUpdateDebounceMs
    ),
    announced: new WeakSet(),
  };
}

function handleMessage(
  setup: EditorSetup,
  editor: Editor,
  message: BridgeMessage
) {
  if (editor.isDestroyed) return;
  if (message.type === PROTOCOL_TYPES.ContainerHeight) {
    if (typeof message.payload === 'number') {
      setup.dynamicHeight.setContainerHeight(message.payload);
    }
    return;
  }
  if (message.type === PROTOCOL_TYPES.SetDynamicHeight) {
    setup.setDynamicHeight?.(message.payload === true);
    return;
  }
  setup.bridges.forEach((bridge) => {
    bridge.onBridgeMessage?.(editor, message, setup.runtime.post);
  });
}

/**
 * Posts `editor-ready` and the full state once per editor. Runs only for the
 * editor the component committed to: `useEditor` may create and discard an
 * editor before its first commit, and native must not see that one.
 */
function announceEditor(setup: EditorSetup, editor: Editor) {
  if (editor.isDestroyed || setup.announced.has(editor)) return;
  setup.announced.add(editor);
  setup.runtime.applyInputMode(editor.view.dom);
  setup.runtime.announceReady();
  setup.publisher.publishNow(editor);
}

/**
 * Wrapper for TipTap's `useEditor` that runs TenTap bridges and talks to the
 * native side: the editor is created from the boot config, announces itself
 * with `editor-ready` followed by a full `stateUpdate`, and receives native
 * commands, including any sent before it existed.
 */
export const useTenTap = (options?: UseTenTapArgs): Editor | null => {
  const {
    tiptapOptions = {},
    bridges = [],
    stateUpdateDebounceMs,
  } = options || {};
  const [setup] = useState(() =>
    createEditorSetup(bridges, stateUpdateDebounceMs)
  );
  const { runtime, config, publisher } = setup;
  const [dynamicHeight, setDynamicHeight] = useState(config.dynamicHeight);
  // Before the subscription below, which may deliver buffered messages.
  useEffect(() => {
    setup.setDynamicHeight = setDynamicHeight;
    return () => {
      setup.setDynamicHeight = undefined;
    };
  }, [setup]);

  const editor = useEditor({
    content: config.initialContent ?? '',
    editable: config.editable,
    ...(config.parseOptions ? { parseOptions: config.parseOptions } : {}),
    shouldRerenderOnTransaction: true,
    ...tiptapOptions,
    extensions: [...setup.extensions, ...(tiptapOptions.extensions || [])],
    onUpdate: (props: EditorEvents['update']) => {
      if (setup.announced.has(props.editor)) {
        publisher.schedule(props.editor);
        runtime.post({ type: CoreEditorActionType.ContentUpdate });
      }
      tiptapOptions.onUpdate?.(props);
    },
    onSelectionUpdate: (props: EditorEvents['selectionUpdate']) => {
      publisher.schedule(props.editor);
      tiptapOptions.onSelectionUpdate?.(props);
    },
    onTransaction: (props: EditorEvents['transaction']) => {
      publisher.schedule(props.editor);
      tiptapOptions.onTransaction?.(props);
    },
  });

  // `useEditor` can hand out an editor it already destroyed when this
  // component's effects ran late; the replacement arrives with a re-render.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const unsubscribe = runtime.subscribe((message) =>
      handleMessage(setup, editor, message)
    );
    const announce = () => announceEditor(setup, editor);
    if (editor.isInitialized) announce();
    else editor.on('create', announce);
    return () => {
      editor.off('create', announce);
      unsubscribe();
    };
  }, [editor, runtime, setup]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    // The class the bundle's EditorContent renders from the boot config.
    editor.view.dom.parentElement?.classList.toggle(
      'dynamic-height',
      dynamicHeight
    );
    if (!dynamicHeight) return;
    applyStyleSheet(DYNAMIC_HEIGHT_STYLE_TAG, DYNAMIC_HEIGHT_CSS);
    return setup.dynamicHeight.observe(editor.view);
  }, [dynamicHeight, editor, setup]);

  useEffect(() => publisher.cancel, [publisher]);

  return editor;
};

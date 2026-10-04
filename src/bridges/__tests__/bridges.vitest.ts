import { Editor, type AnyExtension } from '@tiptap/core';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FIXTURE_MESSAGE_ID,
  getWireFixture,
  wireFixtures,
} from '../../__fixtures__/wire';
import type BridgeExtension from '../base';
import { CoreBridge, CoreEditorActionType } from '../core';
import { blueBackgroundPlugin } from '../HighlightSelection';
import { ImageBridge } from '../image';
import { LinkBridge } from '../link';
import { PlaceholderBridge } from '../placeholder';
import { TenTapStartKit } from '../StarterKit';

type Message = { type: string; payload?: unknown };

const editors: Editor[] = [];

/** The bridges' extensions, shared dependencies (textStyle, listItem) once. */
const extensionsOf = (bridges: BridgeExtension[]): AnyExtension[] => {
  const byName = new Map<string, AnyExtension>();
  bridges
    .flatMap((bridge) =>
      bridge.configureTiptapExtensionsOnRunTime(
        bridge.config,
        bridge.extendConfig
      )
    )
    .forEach((extension) => {
      if (!byName.has(extension.name)) byName.set(extension.name, extension);
    });
  return [...byName.values()];
};

/** A tiptap editor wired to `bridges` the way the web runtime does it. */
const createEditor = (
  content: string,
  {
    bridges = TenTapStartKit,
    extensions = extensionsOf(bridges),
    ...options
  }: {
    bridges?: BridgeExtension[];
    extensions?: AnyExtension[];
  } & Partial<Editor['options']> = {}
) => {
  const element = document.createElement('div');
  document.body.appendChild(element);
  const editor = new Editor({ element, extensions, content, ...options });
  editors.push(editor);

  const replies: Message[] = [];
  const dispatch = (message: Message) =>
    bridges.forEach((bridge) =>
      bridge.onBridgeMessage?.(editor, message, (reply) => replies.push(reply))
    );
  const state = () =>
    Object.assign(
      {},
      ...bridges.map((bridge) => bridge.extendEditorState?.(editor))
    ) as Record<string, unknown>;
  return { editor, dispatch, replies, state };
};

afterEach(() => {
  editors.splice(0).forEach((editor) => {
    editor.view.dom.parentElement?.remove();
    editor.destroy();
  });
});

describe('web halves of the bridges', () => {
  const commands = wireFixtures.filter(
    (fixture) =>
      fixture.direction === 'native-to-web' &&
      fixture.kind === 'message' &&
      fixture.enum !== undefined
  );

  it.each(commands.map((fixture) => [fixture.id, fixture] as const))(
    'handles %s',
    (_id, fixture) => {
      const { dispatch, replies, state } = createEditor(
        '<ul><li><p>Hello</p></li><li><p>World</p></li></ul>'
      );

      expect(() => dispatch(fixture.message)).not.toThrow();
      expect(() => state()).not.toThrow();
      if (fixture.rpc) {
        expect(replies).toHaveLength(1);
        expect(replies[0]!.payload).toMatchObject({
          messageId: FIXTURE_MESSAGE_ID,
        });
      } else {
        expect(replies).toEqual([]);
      }
    }
  );

  it('answers RPCs with the reply types of the fixtures', () => {
    const { dispatch, replies } = createEditor('<p>Hello</p>');

    dispatch(getWireFixture('core.get-html').message);
    dispatch(getWireFixture('core.get-text').message);
    dispatch(getWireFixture('core.get-json').message);
    dispatch(getWireFixture('core.get-selected-text.range').message);

    expect(replies).toEqual([
      getWireFixture('core.send-html-back').message,
      getWireFixture('core.send-text-back').message,
      getWireFixture('core.send-json-back').message,
      getWireFixture('core.send-selected-text-back').message,
    ]);
  });
});

describe('CoreBridge (web)', () => {
  it('collapses whitespace by default and keeps it with parseOptions (#327)', () => {
    const { editor, dispatch } = createEditor('<p></p>');
    const html = '<p>a  b   c</p>';

    dispatch({ type: 'set-content', payload: { content: html } });
    expect(editor.getHTML()).toBe('<p>a b c</p>');

    dispatch({
      type: 'set-content',
      payload: { content: html, parseOptions: { preserveWhitespace: 'full' } },
    });
    expect(editor.getText()).toBe('a  b   c');
  });

  it('applies the editor parseOptions to later setContent calls', () => {
    const { editor, dispatch } = createEditor('<p></p>', {
      parseOptions: { preserveWhitespace: 'full' },
    });

    dispatch({ type: 'set-content', payload: { content: '<p>a  b</p>' } });

    expect(editor.getText()).toBe('a  b');
  });

  it('emits an update unless emitUpdate is false', () => {
    const { editor, dispatch } = createEditor('<p>a</p>');
    const onUpdate = vi.fn();
    editor.on('update', onUpdate);

    dispatch({ type: 'set-content', payload: { content: '<p>b</p>' } });
    dispatch({
      type: 'set-content',
      payload: { content: '<p>c</p>', emitUpdate: false },
    });

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(editor.getHTML()).toBe('<p>c</p>');
  });

  it('inserts content at the cursor, replacing the selection (#62)', () => {
    const { editor, dispatch } = createEditor('<p>Hello world</p>');
    editor.commands.setTextSelection({ from: 7, to: 12 });

    dispatch({
      type: 'insert-content',
      payload: { content: '<strong>there</strong>' },
    });
    dispatch({ type: 'insert-content', payload: { content: '!' } });

    expect(editor.getHTML()).toBe('<p>Hello <strong>there!</strong></p>');
  });

  describe('get-selected-text (#338)', () => {
    const selectedText = (
      content: string,
      payload: object,
      selection?: { from: number; to: number }
    ) => {
      const { editor, dispatch, replies } = createEditor(content);
      if (selection) editor.commands.setTextSelection(selection);
      dispatch({
        type: CoreEditorActionType.GetSelectedText,
        payload: { ...payload, messageId: 'id' },
      });
      return replies[0];
    };

    it('reads the live selection', () => {
      expect(
        selectedText('<p>Hello world</p>', {}, { from: 7, to: 12 })
      ).toEqual({
        type: 'send-selected-text-back',
        payload: { content: 'world', messageId: 'id' },
      });
    });

    it('joins blocks with a newline', () => {
      const reply = selectedText('<p>Hello</p><p>world</p>', {
        range: { from: 1, to: 13 },
      });
      expect(reply?.payload).toMatchObject({ content: 'Hello\nworld' });
    });

    it('clamps and orders the range', () => {
      const reply = selectedText('<p>Hello</p>', {
        range: { from: 500, to: -3 },
      });
      expect(reply?.payload).toMatchObject({ content: 'Hello' });
    });

    it('is empty for a collapsed selection', () => {
      expect(selectedText('<p>Hello</p>', {})?.payload).toMatchObject({
        content: '',
      });
    });
  });

  it('keeps other editorProps when updating the scroll threshold', () => {
    const handleScrollToSelection = vi.fn(() => false);
    const { editor, dispatch } = createEditor('<p>a</p>', {
      editorProps: { handleScrollToSelection },
    });

    dispatch(getWireFixture('core.update-scroll-threshold-and-margin').message);

    expect(editor.options.editorProps).toMatchObject({
      handleScrollToSelection,
      scrollThreshold: { top: 0, bottom: 44, right: 0, left: 0 },
      scrollMargin: { top: 0, bottom: 44, right: 0, left: 0 },
    });
  });

  it('reports focus from the document focus events', () => {
    const { editor, state } = createEditor('<p>a</p>');

    expect(state().isFocused).toBe(false);
    editor.view.dom.dispatchEvent(new FocusEvent('focus'));
    expect(state().isFocused).toBe(true);
    editor.view.dom.dispatchEvent(new FocusEvent('blur'));
    expect(state().isFocused).toBe(false);
  });

  it('reports the core state', () => {
    const { editor, state } = createEditor('<p>a</p>', {
      bridges: [CoreBridge],
    });
    editor.setEditable(false);

    expect(state()).toEqual({
      isFocused: false,
      isReady: true,
      selection: { from: 1, to: 1 },
      editable: false,
      empty: false,
    });
  });
});

describe('LinkBridge (web)', () => {
  const setLink = (
    payload: string | null,
    bridges: BridgeExtension[] = TenTapStartKit
  ) => {
    const { editor, dispatch } = createEditor('<p>Hello</p>', { bridges });
    editor.commands.setTextSelection({ from: 1, to: 6 });
    dispatch({ type: 'set-link', payload });
    return editor.getHTML();
  };

  it('adds https to links typed without a protocol (#255)', () => {
    expect(setLink('www.google.com')).toContain(
      'href="https://www.google.com"'
    );
  });

  it('keeps links that have a protocol', () => {
    expect(setLink('mailto:a@b.co')).toContain('href="mailto:a@b.co"');
  });

  it('uses a configured defaultProtocol', () => {
    const bridges = TenTapStartKit.map((bridge) =>
      bridge === LinkBridge
        ? LinkBridge.configureExtension({ defaultProtocol: 'ftp' })
        : bridge
    );
    expect(setLink('example.com', bridges)).toContain(
      'href="ftp://example.com"'
    );
  });

  it('removes the link for an empty value and ignores null', () => {
    const { editor, dispatch } = createEditor(
      '<p><a href="https://a.b">Hello</a></p>'
    );
    editor.commands.setTextSelection(3);

    dispatch({ type: 'set-link', payload: null });
    expect(editor.getHTML()).toContain('href="https://a.b"');
    dispatch({ type: 'set-link', payload: '  ' });
    expect(editor.getHTML()).toBe('<p>Hello</p>');
  });
});

describe('ImageBridge (web)', () => {
  const setImage = (content: string, position: number, bridges?: never) => {
    const { editor, dispatch } = createEditor(content, { bridges });
    editor.commands.setTextSelection(position);
    dispatch(getWireFixture('image.set').message);
    return editor;
  };
  const src = 'https://10play.dev/logo.png';

  it('adds a paragraph after an image that ends the document (#273)', () => {
    const editor = setImage('<p>Hello</p><p></p>', 8);

    expect(editor.getHTML()).toBe(`<p>Hello</p><img src="${src}"><p></p>`);
    const { selection } = editor.state;
    expect(selection).toBeInstanceOf(TextSelection);
    expect(selection.$from.parent.type.name).toBe('paragraph');
    expect(selection.$from.nodeBefore).toBeNull();

    editor.commands.insertContent('typed');
    expect(editor.getHTML()).toBe(`<p>Hello</p><img src="${src}"><p>typed</p>`);
  });

  it('reuses the paragraph that already follows the image', () => {
    const editor = setImage('<p>Hello</p><p>World</p>', 6);

    expect(editor.getHTML()).toBe(`<p>Hello</p><img src="${src}"><p>World</p>`);
    expect(editor.state.selection.$from.parent.textContent).toBe('World');
    expect(editor.state.selection).not.toBeInstanceOf(NodeSelection);
  });

  it('adds no paragraph for inline images', () => {
    const inline = TenTapStartKit.map((bridge) =>
      bridge === ImageBridge
        ? ImageBridge.configureExtension({ inline: true })
        : bridge
    );
    const { editor, dispatch } = createEditor('<p>Hello</p>', {
      bridges: inline,
    });
    editor.commands.setTextSelection(6);
    dispatch(getWireFixture('image.set').message);

    expect(editor.getHTML()).toBe(`<p>Hello<img src="${src}"></p>`);
    expect(editor.state.selection.from).toBe(7);
  });

  it('resets user image styles on the ProseMirror separator (#291)', () => {
    expect(ImageBridge.extendCSS).toMatch(
      /img\.ProseMirror-separator\s*{[^}]*padding: 0 !important/
    );
    expect(ImageBridge.extendCSS).toContain('img.ProseMirror-selectednode {');
    expect(ImageBridge.extendCSS).not.toContain('img &');
  });
});

describe('PlaceholderBridge (web)', () => {
  it('redraws with the new placeholder', () => {
    const { editor, dispatch } = createEditor('');
    const placeholder = () =>
      editor.view.dom
        .querySelector('[data-placeholder]')
        ?.getAttribute('data-placeholder');

    dispatch(getWireFixture('placeholder.set').message);
    expect(placeholder()).toBe('Write it\'s "here"');
    dispatch({ type: 'set-placeholder', payload: 'Other' });
    expect(placeholder()).toBe('Other');
    expect(editor.can().undo()).toBe(false);
  });

  it('starts from a configured placeholder and can still change it', () => {
    const bridges = TenTapStartKit.map((bridge) =>
      bridge === PlaceholderBridge
        ? PlaceholderBridge.configureExtension({ placeholder: 'Configured' })
        : bridge
    );
    const { editor, dispatch } = createEditor('', { bridges });
    const placeholder = () =>
      editor.view.dom
        .querySelector('[data-placeholder]')
        ?.getAttribute('data-placeholder');

    expect(placeholder()).toBe('Configured');
    dispatch({ type: 'set-placeholder', payload: 'Changed' });
    expect(placeholder()).toBe('Changed');
  });
});

describe('blueBackgroundPlugin', () => {
  it('decorates the selection', () => {
    const { editor } = createEditor('<p>Hello</p>', {
      extensions: [...extensionsOf(TenTapStartKit), blueBackgroundPlugin],
    });

    editor.commands.setTextSelection({ from: 1, to: 3 });
    expect(
      editor.view.dom.querySelector('.highlight-background')?.textContent
    ).toBe('He');
    editor.commands.setTextSelection(2);
    expect(editor.view.dom.querySelector('.highlight-background')).toBeNull();
  });
});

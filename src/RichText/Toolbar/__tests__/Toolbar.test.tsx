import React from 'react';
import {
  FlatList,
  Image,
  Platform,
  TextInput,
  type FlatListProps,
} from 'react-native';
import {
  act,
  fireEvent,
  render,
  screen,
  type RenderResult,
} from '@testing-library/react-native';
import { Images } from '../../../assets';
import { keyboardAccessories } from '../../keyboardAccessories';
import { darkEditorTheme, defaultEditorTheme } from '../../theme';
import { useKeyboard, type KeyboardState } from '../../../utils/useKeyboard';
import {
  DEFAULT_TOOLBAR_ITEMS,
  HEADING_ITEMS,
  Toolbar,
  ToolbarContext,
  type ToolbarItem,
} from '..';
import { LINK_BAR_KEYBOARD_CLOSE_DELAY_MS } from '../Toolbar';
import { createMockEditor, type MockEditor } from './mockEditor';

jest.mock('../../../utils/useKeyboard', () => ({
  useKeyboard: jest.fn(() => ({ isKeyboardUp: true, keyboardHeight: 300 })),
}));

const mockedUseKeyboard = jest.mocked(useKeyboard);

const systemKeyboard = (height: number): KeyboardState => ({
  windowOverlaysKeyboard: false,
  isKeyboardUp: height > 0,
  keyboardHeight: height,
  isCustomKeyboardOpen: false,
  activeCustomKeyboardID: undefined,
  systemKeyboardHeight: height,
  lastKeyboardHeight: height,
  keyboardCoverHeight: 0,
  inlineKeyboardHeight: 0,
  keyboardTop: null,
});

const icons = () =>
  screen.UNSAFE_getAllByType(Image).map((image) => image.props.source);

const pressIcon = (source: unknown) => {
  const image = screen
    .UNSAFE_getAllByType(Image)
    .find((candidate) => candidate.props.source === source);
  if (!image) throw new Error('icon not rendered');
  fireEvent.press(image);
};

const list = () => screen.UNSAFE_getByType(FlatList);

// FlatList renders the first 10 items in tests, so assert on its data.
const listData = () => list().props.data as ToolbarItem[];

const linkInput = () => screen.getByPlaceholderText('Type your URL here...');

const setPlatform = (os: typeof Platform.OS) => {
  const original = Platform.OS;
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
  return () =>
    Object.defineProperty(Platform, 'OS', {
      value: original,
      configurable: true,
    });
};

const openLinkBar = (editor: MockEditor) => {
  render(<Toolbar editor={editor} />);
  pressIcon(Images.link);
};

afterEach(() => {
  jest.useRealTimers();
  mockedUseKeyboard.mockImplementation(() => systemKeyboard(300));
});

describe('toolbar items', () => {
  it('keeps the DEFAULT_TOOLBAR_ITEMS order', () => {
    const editor = createMockEditor();
    const args = {
      editor,
      editorState: editor.getEditorState(),
      setToolbarContext: jest.fn(),
      toolbarContext: ToolbarContext.Main,
    };

    expect(DEFAULT_TOOLBAR_ITEMS.map((item) => item.image(args))).toEqual([
      Images.bold,
      Images.italic,
      Images.link,
      Images.checkList,
      Images.Aa,
      Images.code,
      Images.underline,
      Images.strikethrough,
      Images.quote,
      Images.orderedList,
      Images.bulletList,
      Images.indent,
      Images.outdent,
      Images.undo,
      Images.redo,
    ]);
  });

  it('keeps the ToolbarContext values', () => {
    expect([
      ToolbarContext.Main,
      ToolbarContext.Link,
      ToolbarContext.Heading,
    ]).toEqual([0, 1, 2]);
  });

  it('builds HEADING_ITEMS as close followed by H1-H6', () => {
    const editor = createMockEditor({ headingLevel: 3 });
    const setToolbarContext = jest.fn();
    const args = {
      editor,
      editorState: editor.getEditorState(),
      setToolbarContext,
      toolbarContext: ToolbarContext.Heading,
    };

    expect(HEADING_ITEMS.map((item) => item.image(args))).toEqual([
      Images.close,
      Images.h1,
      Images.h2,
      Images.h3,
      Images.h4,
      Images.h5,
      Images.h6,
    ]);
    expect(HEADING_ITEMS.map((item) => item.active(args))).toEqual([
      false,
      false,
      false,
      true,
      false,
      false,
      false,
    ]);

    HEADING_ITEMS.slice(1).forEach((item) => item.onPress(args)());
    expect(editor.toggleHeading.mock.calls).toEqual([
      [1],
      [2],
      [3],
      [4],
      [5],
      [6],
    ]);

    HEADING_ITEMS[0]!.onPress(args)();
    expect(setToolbarContext).toHaveBeenCalledWith(ToolbarContext.Main);
  });

  it('ships every 1.0 image, including palette', () => {
    expect(Object.keys(Images)).toEqual(
      expect.arrayContaining([
        'indent',
        'outdent',
        'bold',
        'italic',
        'underline',
        'strikethrough',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'orderedList',
        'bulletList',
        'checkList',
        'undo',
        'redo',
        'link',
        'palette',
        'code',
        'quote',
        'Aa',
        'a',
        'close',
      ])
    );
    expect(Images.palette).toBeDefined();
    expect(Images.keyboard).toBeDefined();
  });
});

describe('<Toolbar />', () => {
  it('renders the default items and runs their commands', () => {
    const editor = createMockEditor();
    render(<Toolbar editor={editor} />);

    expect(listData()).toBe(DEFAULT_TOOLBAR_ITEMS);
    pressIcon(Images.bold);
    expect(editor.toggleBold).toHaveBeenCalledTimes(1);
  });

  it('exposes the items to accessibility services', () => {
    const editor = createMockEditor({ isBoldActive: true, canRedo: false });
    render(<Toolbar editor={editor} />);

    expect(
      screen.getByRole('button', { name: 'Bold', selected: true })
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Italic', selected: false })
    ).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Bold' }));
    expect(editor.toggleBold).toHaveBeenCalledTimes(1);
  });

  it('labels every default item', () => {
    const labels = [...DEFAULT_TOOLBAR_ITEMS, ...HEADING_ITEMS].map(
      (item) => item.label
    );
    expect(labels.every(Boolean)).toBe(true);
    expect(new Set(labels).size).toBe(labels.length);
    expect(DEFAULT_TOOLBAR_ITEMS.at(-1)).toMatchObject({ label: 'Redo' });
  });

  it('remounts the list at offset 0 when the context changes (#298)', () => {
    const editor = createMockEditor();
    render(<Toolbar editor={editor} />);
    const mainList = list().instance;

    pressIcon(Images.Aa);
    const headingList = list().instance;
    expect(headingList).not.toBe(mainList);
    expect(listData()).toBe(HEADING_ITEMS);
    expect(icons()[0]).toBe(Images.close);

    pressIcon(Images.close);
    expect(list().instance).not.toBe(headingList);
    expect(listData()).toBe(DEFAULT_TOOLBAR_ITEMS);
  });

  it('marks itself as drawn over the editor while shown', () => {
    const view = { measureInWindow: jest.fn() };
    const editor = createMockEditor({ isFocused: true });
    const { rerender } = render(<Toolbar editor={editor} />);
    act(() =>
      list().props.onLayout({
        currentTarget: view,
        nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 44 } },
      })
    );
    expect(keyboardAccessories.getViews()).toEqual([view]);

    rerender(<Toolbar editor={editor} hidden />);
    expect(keyboardAccessories.getViews()).toEqual([]);
    rerender(<Toolbar editor={editor} />);
    expect(keyboardAccessories.getViews()).toEqual([view]);
    screen.unmount();
    expect(keyboardAccessories.getViews()).toEqual([]);
  });

  it('keeps the list instance while the editor state changes', () => {
    const editor = createMockEditor();
    render(<Toolbar editor={editor} />);
    const mainList = list().instance;

    act(() => editor.emitState({ isBoldActive: true }));

    expect(list().instance).toBe(mainList);
  });

  it('renders custom headingItems (#295)', () => {
    const editor = createMockEditor();
    const headingItems = HEADING_ITEMS.slice(0, 3);
    render(<Toolbar editor={editor} headingItems={headingItems} />);

    pressIcon(Images.Aa);

    expect(icons()).toEqual([Images.close, Images.h1, Images.h2]);
    pressIcon(Images.h2);
    expect(editor.toggleHeading).toHaveBeenCalledWith(2);
  });

  it('applies shouldHideDisabledToolbarItems to the heading toolbar too', () => {
    const editor = createMockEditor({ canUndo: false });
    render(<Toolbar editor={editor} shouldHideDisabledToolbarItems />);
    expect(listData()).toEqual(
      DEFAULT_TOOLBAR_ITEMS.filter((_, index) => index !== 13)
    );

    pressIcon(Images.Aa);
    expect(icons()).toHaveLength(HEADING_ITEMS.length);

    act(() => editor.emitState({ canToggleHeading: false }));
    expect(icons()).toEqual([Images.close]);
  });

  it('renders through a custom ListComponent (#173)', () => {
    const editor = createMockEditor();
    const rendered: ToolbarItem[][] = [];
    const ListComponent = (props: FlatListProps<ToolbarItem>) => {
      rendered.push([...(props.data as ToolbarItem[])]);
      return <FlatList {...props} />;
    };
    render(<Toolbar editor={editor} ListComponent={ListComponent} />);

    expect(rendered.at(-1)).toEqual(DEFAULT_TOOLBAR_ITEMS);
    expect(icons()[0]).toBe(Images.bold);
  });

  describe('visibility', () => {
    const hiddenStyle = (result: RenderResult) =>
      result.UNSAFE_getByType(FlatList).props.style;

    it('hides while the keyboard is down', () => {
      mockedUseKeyboard.mockReturnValue(systemKeyboard(0));
      const editor = createMockEditor();
      const result = render(<Toolbar editor={editor} />);

      expect(hiddenStyle(result)).toContain(defaultEditorTheme.toolbar.hidden);
    });

    it('hides while the editor is blurred', () => {
      const editor = createMockEditor({ isFocused: false });
      const result = render(<Toolbar editor={editor} />);

      expect(hiddenStyle(result)).toContain(defaultEditorTheme.toolbar.hidden);
    });

    it('stays visible while useKeyboard reports a keyboard (system or custom)', () => {
      const editor = createMockEditor();
      const result = render(<Toolbar editor={editor} />);

      expect(hiddenStyle(result)).not.toContain(
        defaultEditorTheme.toolbar.hidden
      );
    });

    it('lets the hidden prop override the automatic behaviour', () => {
      mockedUseKeyboard.mockReturnValue(systemKeyboard(0));
      const editor = createMockEditor({ isFocused: false });
      const result = render(<Toolbar editor={editor} hidden={false} />);

      expect(hiddenStyle(result)).not.toContain(
        defaultEditorTheme.toolbar.hidden
      );
    });
  });

  it('renders a plain row with the same items on web', () => {
    const restorePlatform = setPlatform('web');
    try {
      const editor = createMockEditor();
      render(
        <Toolbar editor={editor} headingItems={HEADING_ITEMS.slice(0, 2)} />
      );
      expect(screen.UNSAFE_queryByType(FlatList)).toBeNull();
      expect(icons()).toHaveLength(DEFAULT_TOOLBAR_ITEMS.length);

      pressIcon(Images.Aa);
      expect(icons()).toEqual([Images.close, Images.h1]);
    } finally {
      restorePlatform();
    }
  });

  it('picks up the editor theme', () => {
    const editor = createMockEditor({}, darkEditorTheme);
    render(<Toolbar editor={editor} />);

    expect(list().props.style).toContain(darkEditorTheme.toolbar.toolbarBody);
  });

  it('restyles the items when the theme changes without a state update', () => {
    const editor = createMockEditor();
    const { rerender } = render(<Toolbar editor={editor} />);
    const boldIconStyle = () =>
      screen
        .UNSAFE_getAllByType(Image)
        .find((image) => image.props.source === Images.bold)!.props.style;
    expect(boldIconStyle()).toContain(defaultEditorTheme.toolbar.icon);

    editor.theme = darkEditorTheme;
    rerender(<Toolbar editor={editor} />);

    expect(boldIconStyle()).toContain(darkEditorTheme.toolbar.icon);
  });
});

describe('link bar (#252)', () => {
  it('opens with a URL keyboard that submits with Done', () => {
    const editor = createMockEditor();
    openLinkBar(editor);

    expect(linkInput().props).toMatchObject({
      keyboardType: 'url',
      returnKeyType: 'done',
      autoCorrect: false,
      autoCapitalize: 'none',
      autoFocus: true,
    });
  });

  it('stays open after the input blurs so Insert still works', () => {
    const editor = createMockEditor();
    openLinkBar(editor);

    fireEvent.changeText(linkInput(), 'www.github.com');
    fireEvent(linkInput(), 'blur');
    fireEvent.press(screen.getByText('Insert'));

    expect(editor.setLink).toHaveBeenCalledWith('www.github.com');
    expect(editor.focus).toHaveBeenCalled();
    expect(screen.queryByText('Insert')).toBeNull();
    expect(list()).toBeTruthy();
  });

  it('closes once the keyboard is dismissed, like the 1.0 blur close', () => {
    jest.useFakeTimers();
    const editor = createMockEditor();
    const { rerender } = render(<Toolbar editor={editor} />);
    pressIcon(Images.link);

    mockedUseKeyboard.mockImplementation(() => systemKeyboard(0));
    rerender(<Toolbar editor={editor} />);
    expect(screen.getByText('Insert')).toBeTruthy();
    act(() => jest.advanceTimersByTime(LINK_BAR_KEYBOARD_CLOSE_DELAY_MS));

    expect(screen.queryByText('Insert')).toBeNull();
    expect(list().props.style).toContain(defaultEditorTheme.toolbar.hidden);
  });

  it('stays open when the keyboard comes back right away', () => {
    jest.useFakeTimers();
    const editor = createMockEditor();
    const { rerender } = render(<Toolbar editor={editor} />);
    pressIcon(Images.link);

    mockedUseKeyboard.mockImplementation(() => systemKeyboard(0));
    rerender(<Toolbar editor={editor} />);
    mockedUseKeyboard.mockImplementation(() => systemKeyboard(300));
    rerender(<Toolbar editor={editor} />);
    act(() => jest.advanceTimersByTime(LINK_BAR_KEYBOARD_CLOSE_DELAY_MS));

    expect(screen.getByText('Insert')).toBeTruthy();
  });

  it('is hidden by hidden={true}', () => {
    const editor = createMockEditor();
    const { rerender } = render(<Toolbar editor={editor} />);
    pressIcon(Images.link);

    rerender(<Toolbar editor={editor} hidden />);
    expect(screen.queryByText('Insert')).toBeNull();
    rerender(<Toolbar editor={editor} />);
    expect(screen.getByText('Insert')).toBeTruthy();
  });

  it('inserts the link when the keyboard submits', () => {
    const editor = createMockEditor();
    openLinkBar(editor);

    fireEvent.changeText(linkInput(), 'https://10play.dev');
    fireEvent(linkInput(), 'submitEditing');

    expect(editor.setLink).toHaveBeenCalledWith('https://10play.dev');
    expect(screen.queryByText('Insert')).toBeNull();
  });

  it('leaves the live selection alone on iOS', () => {
    const editor = createMockEditor();
    openLinkBar(editor);
    fireEvent.press(screen.getByText('Insert'));
    expect(editor.setSelection).not.toHaveBeenCalled();
  });

  it('closes from the link icon without setting a link', () => {
    const editor = createMockEditor();
    openLinkBar(editor);

    const [linkIcon] = screen.UNSAFE_getAllByType(Image);
    fireEvent.press(linkIcon!);

    expect(editor.setLink).not.toHaveBeenCalled();
    expect(editor.focus).toHaveBeenCalled();
    expect(screen.queryByText('Insert')).toBeNull();
  });

  it('prefills and follows the active link', () => {
    const editor = createMockEditor({ activeLink: 'https://a.dev' });
    openLinkBar(editor);
    expect(linkInput().props.value).toBe('https://a.dev');

    act(() => editor.emitState({ activeLink: 'https://b.dev' }));
    expect(linkInput().props.value).toBe('https://b.dev');
  });

  it('uses the theme hintText as placeholder (PR #239)', () => {
    const theme = {
      ...defaultEditorTheme,
      toolbar: {
        ...defaultEditorTheme.toolbar,
        linkBarTheme: {
          ...defaultEditorTheme.toolbar.linkBarTheme,
          hintText: 'Lien',
        },
      },
    };
    const editor = createMockEditor({}, theme);
    openLinkBar(editor);

    expect(screen.UNSAFE_getByType(TextInput).props.placeholder).toBe('Lien');
  });

  describe('on Android', () => {
    let restorePlatform: () => void;
    beforeEach(() => {
      restorePlatform = setPlatform('android');
      jest.useFakeTimers();
    });
    afterEach(() => restorePlatform());

    it('restores the selection and closes after the editor regains focus', () => {
      const editor = createMockEditor();
      openLinkBar(editor);
      act(() => jest.runOnlyPendingTimers());
      expect(editor.setSelection).toHaveBeenCalledWith(1, 4);

      fireEvent.changeText(linkInput(), 'https://10play.dev');
      fireEvent.press(screen.getByText('Insert'));
      expect(editor.setLink).toHaveBeenCalledWith('https://10play.dev');
      expect(screen.getByText('Insert')).toBeTruthy();

      act(() => jest.advanceTimersByTime(100));
      expect(screen.queryByText('Insert')).toBeNull();
    });

    it('applies the link to the selection held when the bar opened', () => {
      const editor = createMockEditor({ selection: { from: 1, to: 6 } });
      openLinkBar(editor);
      act(() => jest.runOnlyPendingTimers());
      // The link input's focus collapses the WebView selection.
      act(() => editor.emitState({ selection: { from: 1, to: 1 } }));
      editor.setSelection.mockClear();

      fireEvent.changeText(linkInput(), 'example.com');
      fireEvent.press(screen.getByText('Insert'));

      expect(editor.setSelection).toHaveBeenCalledWith(1, 6);
      expect(editor.setSelection.mock.invocationCallOrder[0]).toBeLessThan(
        editor.setLink.mock.invocationCallOrder[0]!
      );
      expect(editor.setLink).toHaveBeenCalledWith('example.com');
    });

    it('follows a range selected in the editor while the bar is open', () => {
      const editor = createMockEditor({ selection: { from: 1, to: 6 } });
      openLinkBar(editor);
      act(() => jest.runOnlyPendingTimers());
      act(() =>
        editor.emitState({ isFocused: true, selection: { from: 7, to: 12 } })
      );
      // Focusing the link input again collapses the selection.
      act(() =>
        editor.emitState({ isFocused: false, selection: { from: 7, to: 7 } })
      );
      editor.setSelection.mockClear();

      fireEvent.changeText(linkInput(), 'example.com');
      fireEvent.press(screen.getByText('Insert'));

      expect(editor.setSelection).toHaveBeenCalledWith(7, 12);
    });

    it('takes the selection from the latest state before the bar opens', () => {
      const editor = createMockEditor({ selection: { from: 1, to: 1 } });
      render(<Toolbar editor={editor} />);
      act(() => editor.emitState({ selection: { from: 2, to: 8 } }));
      pressIcon(Images.link);
      act(() => jest.runOnlyPendingTimers());
      editor.setSelection.mockClear();

      fireEvent.press(screen.getByText('Insert'));
      expect(editor.setSelection).toHaveBeenCalledWith(2, 8);
    });

    it('cancels the pending close on unmount', () => {
      const editor = createMockEditor();
      openLinkBar(editor);
      act(() => jest.runOnlyPendingTimers());
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      fireEvent.press(screen.getByText('Insert'));
      const closeCall = setTimeoutSpy.mock.calls.findIndex(
        ([, delay]) => delay === 100
      );
      const closeTimer = setTimeoutSpy.mock.results[closeCall]?.value;

      screen.unmount();
      expect(closeTimer).toBeDefined();
      expect(clearTimeoutSpy).toHaveBeenCalledWith(closeTimer);
    });
  });
});

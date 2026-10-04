import React, { useState } from 'react';
import {
  AppRegistry,
  Button,
  DeviceEventEmitter,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  within,
} from '@testing-library/react-native';
import { useKeyboard } from '../../../utils/useKeyboard';
import type { EditorBridge } from '../../../types';
import { EditorHelper } from '../../EditorHelper';
import { ColorKeyboard } from '../ColorKeyboard';
import { CustomKeyboard, type CustomKeyboardProps } from '../CustomKeyboard';
import {
  CustomKeyboardExtension,
  type CustomKeyboardComponentProps,
} from '../CustomKeyboardExtension';
import { useCustomKeyboard, useCustomKeyboardHeight } from '../context';
import { INPUT_MODE_SCRIPT_KEY } from '../drivers';
import { EditorKeyboardAvoidingView } from '../EditorKeyboardAvoidingView';
import { defaultColorKeyboardTheme } from '../keyboardTheme';
import { SLOT_ANIMATION_MS } from '../keyboardSession';
import { getNativeKeyboardModule } from '../nativeModule';
import { TenTapView } from '../TenTapView';
import { createFakeEditor, flush } from './fakes';

const BODY = 'tentap-custom-keyboard';

const emitKeyboard = (name: string, height: number) =>
  act(() => {
    DeviceEventEmitter.emit(name, {
      duration: 0,
      easing: 'keyboard',
      endCoordinates: { height, width: 750, screenX: 0, screenY: 0 },
    });
  });

const settle = () =>
  act(async () => {
    await flush();
  });

const PropsProbe = jest.fn((_props: Partial<CustomKeyboardComponentProps>) => (
  <Text>probe keyboard</Text>
));
const ProbeKeyboard = new CustomKeyboardExtension('test.probe', PropsProbe, {
  height: 280,
});

const LegacyKeyboard = new CustomKeyboardExtension('test.legacy', () => (
  <Text>legacy keyboard</Text>
));

// The height cache is process-wide; a fixed height keeps tests independent.
const FixedKeyboard = new CustomKeyboardExtension(
  'test.fixed',
  () => <Text>fixed keyboard</Text>,
  { height: 300 }
);

/** The 0.7.x pattern: the parent owns the active id. */
const Host = ({
  editor,
  initialId,
  ...props
}: Partial<CustomKeyboardProps> & {
  editor: EditorBridge;
  initialId?: string;
}) => {
  const [activeId, setActiveId] = useState<string | undefined>(initialId);
  return (
    <View>
      <Text testID="active-id">{activeId ?? 'none'}</Text>
      <CustomKeyboard
        editor={editor}
        keyboards={[
          ProbeKeyboard,
          LegacyKeyboard,
          FixedKeyboard,
          ColorKeyboard,
        ]}
        activeKeyboardID={activeId}
        setActiveKeyboardID={setActiveId}
        {...props}
      />
    </View>
  );
};

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  emitKeyboard('keyboardWillHide', 0);
  jest.restoreAllMocks();
  PropsProbe.mockClear();
});

describe('CustomKeyboard', () => {
  it('uses the fallback driver when the native module is not linked', async () => {
    expect(getNativeKeyboardModule()).toBeNull();
    const { editor, controller } = createFakeEditor();
    render(<Host editor={editor} initialId="test.probe" />);
    await settle();
    expect(controller.persistent.has(INPUT_MODE_SCRIPT_KEY)).toBe(true);
  });

  it('renders the active keyboard with editor, close and height', async () => {
    const { editor } = createFakeEditor();
    render(<Host editor={editor} initialId="test.probe" />);
    await settle();

    expect(screen.getByText('probe keyboard')).toBeTruthy();
    const props = PropsProbe.mock.calls.at(-1)![0];
    expect(props.editor).toBe(editor);
    expect(props.keyboardHeight).toBe(280);
    expect(
      StyleSheet.flatten(screen.getByTestId(BODY).props.style)
    ).toMatchObject({
      height: 280,
      backgroundColor: defaultColorKeyboardTheme.keyboardRootColor,
    });

    act(() => props.close!());
    expect(screen.getByTestId('active-id').props.children).toBe('none');
  });

  it('renders keyboard components written for 0.7.x', async () => {
    const { editor } = createFakeEditor();
    render(<Host editor={editor} initialId="test.legacy" />);
    await settle();
    expect(screen.getByText('legacy keyboard')).toBeTruthy();
  });

  it('applies rootBackground and accepts the deprecated rootRef', async () => {
    const { editor } = createFakeEditor();
    render(
      <Host
        editor={editor}
        initialId="test.probe"
        rootBackground="#313132"
        rootRef={{ current: null }}
      />
    );
    await settle();
    expect(
      StyleSheet.flatten(screen.getByTestId(BODY).props.style).backgroundColor
    ).toBe('#313132');
  });

  it('remounts the keyboard on every open (#51)', async () => {
    const mounts = jest.fn();
    const unmounts = jest.fn();
    const Counting = () => {
      React.useEffect(() => {
        mounts();
        return unmounts;
      }, []);
      return <Text>counting</Text>;
    };
    const keyboard = new CustomKeyboardExtension('test.counting', Counting);
    const { editor, controller } = createFakeEditor();
    const view = render(
      <CustomKeyboard
        editor={editor}
        keyboards={[keyboard]}
        activeKeyboardID="test.counting"
        setActiveKeyboardID={() => {}}
      />
    );
    for (let i = 0; i < 5; i++) {
      await settle();
      view.rerender(
        <CustomKeyboard
          editor={editor}
          keyboards={[keyboard]}
          activeKeyboardID={undefined}
          setActiveKeyboardID={() => {}}
        />
      );
      // Hardware keyboard: no show event, the body unmounts after the ceiling.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 650));
      });
      view.rerender(
        <CustomKeyboard
          editor={editor}
          keyboards={[keyboard]}
          activeKeyboardID="test.counting"
          setActiveKeyboardID={() => {}}
        />
      );
    }
    await settle();
    expect(mounts).toHaveBeenCalledTimes(6);
    expect(unmounts).toHaveBeenCalledTimes(5);
    expect(controller.commandTypes()).not.toContain('focus');
  }, 10000);

  it('closes when the app focuses the editor', async () => {
    const { editor } = createFakeEditor();
    render(<Host editor={editor} initialId="test.probe" />);
    await settle();
    act(() => editor.focus());
    expect(screen.getByTestId('active-id').props.children).toBe('none');
  });
});

describe('ColorKeyboard', () => {
  it('renders the default palette when the theme has no colorKeyboard (#285)', async () => {
    const { editor } = createFakeEditor();
    render(<Host editor={editor} initialId={ColorKeyboard.id} />);
    await settle();
    expect(ColorKeyboard.id).toBe('keyboard.color');
    for (const { name } of defaultColorKeyboardTheme.colorSelection) {
      expect(screen.getAllByText(name).length).toBe(2);
    }
  });

  it('applies a color, then focuses back to the system keyboard', async () => {
    const { editor } = createFakeEditor();
    render(<Host editor={editor} initialId={ColorKeyboard.id} />);
    await settle();
    fireEvent.press(screen.getAllByText('Red')[0]!);
    expect(editor.setColor).toHaveBeenCalledWith('#EF233C');
    expect(editor.focus).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('active-id').props.children).toBe('none');

    fireEvent.press(screen.getAllByText('Default')[1]!);
    expect(editor.unsetHighlight).toHaveBeenCalled();
  });

  it('marks the active color from the bridge state', async () => {
    const fake = createFakeEditor();
    render(<Host editor={fake.editor} initialId={ColorKeyboard.id} />);
    await settle();
    const selectedNames = () =>
      screen
        .getAllByRole('button', { selected: true })
        .map((button) => within(button).getByText(/./).props.children);
    expect(selectedNames()).toEqual(['Default', 'Default']);
    act(() => fake.setState({ activeColor: '#EF233C' }));
    expect(selectedNames()).toEqual(['Red', 'Default']);
  });

  it("uses the editor theme's colorKeyboard", async () => {
    const { editor } = createFakeEditor({
      theme: {
        colorKeyboard: {
          ...defaultColorKeyboardTheme,
          colorSelection: [{ name: 'Brand', value: '#123456' }],
        },
      },
    });
    render(<Host editor={editor} initialId={ColorKeyboard.id} />);
    await settle();
    fireEvent.press(screen.getByText('Brand'));
    expect(editor.setColor).toHaveBeenCalledWith('#123456');
  });

  it('targets the last editor when rendered without props (0.7.x)', () => {
    const { editor } = createFakeEditor();
    EditorHelper.setEditorLastInstance(editor);
    const Comp = ColorKeyboard.comp;
    render(<Comp />);
    fireEvent.press(screen.getAllByText('Red')[0]!);
    expect(editor.setColor).toHaveBeenCalledWith('#EF233C');
  });
});

describe('hooks', () => {
  it('useKeyboard follows the system keyboard', () => {
    const { result } = renderHook(() => useKeyboard());
    expect(result.current).toMatchObject({
      isKeyboardUp: false,
      keyboardHeight: 0,
    });
    emitKeyboard('keyboardWillShow', 336);
    expect(result.current).toMatchObject({
      isKeyboardUp: true,
      keyboardHeight: 336,
    });
    emitKeyboard('keyboardWillHide', 336);
    expect(result.current).toMatchObject({
      isKeyboardUp: false,
      keyboardHeight: 0,
      lastKeyboardHeight: 336,
    });
  });

  it('useCustomKeyboard opens a keyboard from a sibling toolbar', async () => {
    const { editor } = createFakeEditor();
    const Toolbar = () => {
      const { activeKeyboardID, open, dismiss } = useCustomKeyboard(editor);
      const height = useCustomKeyboardHeight(editor);
      return (
        <View>
          <Text testID="toolbar-state">{`${activeKeyboardID ?? 'none'}:${height}`}</Text>
          <Button title="open" onPress={() => open(FixedKeyboard.id)} />
          <Button title="hide" onPress={dismiss} />
        </View>
      );
    };
    render(
      <>
        <Toolbar />
        <Host editor={editor} />
      </>
    );
    fireEvent.press(screen.getByText('open'));
    await settle();
    expect(screen.getByTestId('active-id').props.children).toBe(
      FixedKeyboard.id
    );
    expect(screen.getByTestId('toolbar-state').props.children).toBe(
      `${FixedKeyboard.id}:300`
    );
    fireEvent.press(screen.getByText('hide'));
    expect(screen.getByTestId('active-id').props.children).toBe('none');
    expect(screen.getByTestId('toolbar-state').props.children).toBe('none:0');
    // The body slides out with the slot before it unmounts.
    expect(screen.getByTestId(BODY)).toBeTruthy();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, SLOT_ANIMATION_MS));
    });
    expect(screen.queryByTestId(BODY)).toBeNull();
  });

  it('useCustomKeyboard is inert without a CustomKeyboard', () => {
    const { result } = renderHook(() => useCustomKeyboard());
    expect(result.current.activeKeyboardID).toBeUndefined();
    expect(() => result.current.open('x')).not.toThrow();
  });
});

describe('EditorKeyboardAvoidingView', () => {
  const padding = () =>
    StyleSheet.flatten(screen.getByTestId('avoider').props.style).paddingBottom;

  it('pads by the system keyboard where it overlays the window (iOS)', () => {
    render(<EditorKeyboardAvoidingView testID="avoider" />);
    expect(padding()).toBe(0);
    emitKeyboard('keyboardWillShow', 336);
    expect(padding()).toBe(336);
  });

  it('holds the height while a custom keyboard is open', async () => {
    const { editor } = createFakeEditor();
    render(
      <>
        <EditorKeyboardAvoidingView
          testID="avoider"
          keyboardVerticalOffset={34}
        />
        <Host editor={editor} initialId="test.fixed" layout="overlay" />
      </>
    );
    await settle();
    expect(padding()).toBe(266);
  });

  it('can be disabled', () => {
    render(<EditorKeyboardAvoidingView testID="avoider" enabled={false} />);
    emitKeyboard('keyboardWillShow', 336);
    expect(padding()).toBe(0);
  });
});

describe('compatibility', () => {
  it('CustomKeyboardExtension still registers the component by id', () => {
    const spy = jest.spyOn(AppRegistry, 'registerComponent');
    const Comp = () => null;
    const extension = new CustomKeyboardExtension('test.registered', Comp);
    expect(extension).toMatchObject({
      id: 'test.registered',
      comp: Comp,
      options: {},
    });
    expect(spy).toHaveBeenCalledWith('test.registered', expect.any(Function));
    expect(spy.mock.calls[0]![1]()).toBe(Comp);
  });

  it('TenTapView renders nothing and warns once', () => {
    render(
      <>
        <TenTapView keyboardHeight={0} keyboardID="keyboard.color" />
        <TenTapView keyboardHeight={0} />
      </>
    );
    expect(screen.toJSON()).toBeNull();
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});

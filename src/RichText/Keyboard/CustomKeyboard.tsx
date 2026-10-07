import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type RefObject,
} from 'react';
import {
  BackHandler,
  Dimensions,
  LayoutAnimation,
  Platform,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
  type ColorValue,
} from 'react-native';
import { keyboardStore } from '../../native/keyboardStore';
import type { EditorBridge } from '../../types';
import { HiddenFocusInput } from '../HiddenFocusInput';
import { measureViewGeometry } from '../keyboardAccessories';
import { CustomKeyboardContext } from './context';
import type {
  AnyCustomKeyboardExtension,
  CustomKeyboardComponentProps,
} from './CustomKeyboardExtension';
import { createEditorChannel } from './editorChannel';
import {
  SLOT_ANIMATION_MS,
  createKeyboardSession,
  type AndroidKeyboardMode,
  type KeyboardErrorEvent,
  type KeyboardSessionOptions,
} from './keyboardSession';
import { resolveColorKeyboardTheme } from './keyboardTheme';
import { getNativeKeyboardModule } from './nativeModule';

export interface CustomKeyboardProps {
  editor: EditorBridge;
  keyboards: readonly AnyCustomKeyboardExtension[];
  /** Controlled: the open keyboard, `undefined` for the system keyboard. */
  activeKeyboardID?: string;
  setActiveKeyboardID: (id: string | undefined) => void;
  /** Background of the keyboard area. Defaults to `theme.colorKeyboard.keyboardRootColor`. */
  rootBackground?: ColorValue;
  /**
   * - `inline` (default): an in-flow slot that grows to the keyboard height.
   *   Place it at the bottom of the `EditorKeyboardAvoidingView` (or
   *   `KeyboardAvoidingView`), under the toolbar.
   * - `overlay`: the keyboard is drawn over the bottom of the window and
   *   takes no space; reserve it with `EditorKeyboardAvoidingView` or
   *   `useKeyboard().keyboardHeight`. Render it in a container that reaches
   *   the bottom of the window.
   */
  layout?: 'inline' | 'overlay';
  /** Height before any system keyboard was seen. Defaults to 38% of the window. */
  defaultHeight?: number;
  /** Tapping the editor closes the custom keyboard. Default `true`. */
  closeOnEditorPress?: boolean;
  /**
   * Android only, read at mount. `'stable'` sets ADJUST_NOTHING on the
   * activity window while mounted (API 30+), so the window never resizes
   * during a swap. Default `'system'` leaves the window mode alone.
   */
  androidKeyboardMode?: AndroidKeyboardMode;
  /** Use the JS fallback driver even when the native module is linked. */
  forceFallback?: boolean;
  onOpen?: (id: string) => void;
  onClose?: () => void;
  onKeyboardError?: (event: KeyboardErrorEvent) => void;
  /**
   * @deprecated Use `onClose`. Fires on both platforms when the system
   * keyboard comes back while a custom keyboard is up.
   */
  onKeyboardHideAndroid?: () => void;
  /** @deprecated Ignored since 1.1; keyboards render in place. */
  rootRef?: RefObject<unknown>;
}

const PLACEMENT_CHECK_DELAY_MS = SLOT_ANIMATION_MS + 50;

export interface OverlayBodyInput {
  keyboardHeight: number;
  navigationBarInset: number;
  /** Bottom of the host in window coordinates, undefined until measured. */
  hostBottom: number | undefined;
  /** `keyboardStore.getKeyboardBottom()`. */
  keyboardBottom: number | undefined;
  windowHeight: number;
}

export interface OverlayBodyFrame {
  /** Offset from the top of the host, which is pinned to the bottom of its parent. */
  top: number;
  height: number;
  /** Space below the keyboard content, over the navigation bar. */
  paddingBottom: number;
}

/**
 * Frame of an overlay keyboard's body: its content where the system
 * keyboard was, ending where that one ended, and the body reaching on down
 * to the bottom of the host, over an edge-to-edge navigation bar. A host
 * that ends above the keyboard's bottom has the body moved down, never up.
 * Before a system keyboard was seen, the body has the navigation bar inset
 * the native module reports below the content and reaches at least the
 * bottom of the window.
 */
export const getOverlayBodyFrame = ({
  keyboardHeight,
  navigationBarInset,
  hostBottom,
  keyboardBottom,
  windowHeight,
}: OverlayBodyInput): OverlayBodyFrame => {
  if (hostBottom === undefined || keyboardBottom === undefined) {
    return {
      top:
        hostBottom === undefined ? 0 : Math.max(0, windowHeight - hostBottom),
      height: keyboardHeight + navigationBarInset,
      paddingBottom: navigationBarInset,
    };
  }
  const below = hostBottom - keyboardBottom;
  return {
    top: Math.max(0, -below),
    height: keyboardHeight + Math.max(0, below),
    paddingBottom: Math.max(0, below),
  };
};

export const CustomKeyboard = (props: CustomKeyboardProps) => {
  const {
    editor,
    keyboards,
    activeKeyboardID,
    rootBackground,
    layout = 'inline',
    forceFallback = false,
  } = props;
  const latestProps = useRef(props);
  useLayoutEffect(() => {
    latestProps.current = props;
  });
  const hiddenInputRef = useRef<TextInput>(null);
  const hostRef = useRef<View>(null);

  const session = useMemo(
    () =>
      createKeyboardSession({
        platform: Platform.OS,
        editor,
        channel: createEditorChannel(editor),
        store: keyboardStore,
        nativeModule: getNativeKeyboardModule(),
        forceFallback,
        getHiddenInput: () => hiddenInputRef.current,
        layoutAnimation: LayoutAnimation,
        backHandler: BackHandler,
        subscribeWindow: (listener) => {
          const subscription = Dimensions.addEventListener('change', listener);
          return () => subscription.remove();
        },
        getOptions: (): KeyboardSessionOptions => {
          const current = latestProps.current;
          return {
            defaultHeight: current.defaultHeight,
            closeOnEditorPress: current.closeOnEditorPress ?? true,
            androidKeyboardMode: current.androidKeyboardMode ?? 'system',
            heightOf: (id) =>
              current.keyboards.find((keyboard) => keyboard.id === id)?.options
                .height,
            onActiveKeyboardChange: (id) => current.setActiveKeyboardID(id),
            onOpen: current.onOpen,
            onClose: current.onClose,
            onKeyboardError: current.onKeyboardError,
            onSystemKeyboardReturn: current.onKeyboardHideAndroid,
            inline: (current.layout ?? 'inline') === 'inline',
          };
        },
      }),
    [editor, forceFallback]
  );

  useEffect(() => {
    session.attach();
    return () => session.detach();
  }, [session]);

  useEffect(() => {
    session.sync(activeKeyboardID);
  }, [session, activeKeyboardID]);

  const view = useSyncExternalStore(session.subscribe, session.getView);
  const close = useCallback(() => session.close(true), [session]);

  const { height: windowHeight } = useWindowDimensions();
  const keyboardBottom = useSyncExternalStore(
    keyboardStore.subscribe,
    keyboardStore.getKeyboardBottom
  );
  const [hostBottom, setHostBottom] = useState<number>();
  const measureHost = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    measureViewGeometry(host);
    host.measureInWindow((_x, y, _width, height) => setHostBottom(y + height));
  }, []);

  usePlacementCheck(
    __DEV__ && Platform.OS === 'ios' && layout === 'inline'
      ? view.phase
      : undefined,
    hostRef,
    windowHeight
  );

  const keyboard = keyboards.find(({ id }) => id === view.renderedKeyboardID);
  // Every keyboard component accepts these props, even if it ignores them.
  const Body = keyboard?.comp as
    ComponentType<CustomKeyboardComponentProps> | undefined;
  // An overlay host covers the bottom of its parent, so the body, pinned to
  // the bottom of the window, stays inside it: accessibility services skip
  // views outside their parent's bounds.
  const body =
    layout === 'overlay'
      ? getOverlayBodyFrame({
          keyboardHeight: view.keyboardHeight,
          navigationBarInset: view.navigationBarInset,
          hostBottom,
          keyboardBottom,
          windowHeight,
        })
      : {
          top: 0,
          height: view.keyboardHeight + view.navigationBarInset,
          paddingBottom: view.navigationBarInset,
        };
  const hostStyle =
    layout === 'overlay'
      ? [styles.overlayHost, { height: Body ? body.height : 0 }]
      : { height: view.slotHeight };

  return (
    <CustomKeyboardContext.Provider value={session}>
      <View
        ref={hostRef}
        collapsable={false}
        onLayout={layout === 'overlay' ? measureHost : undefined}
        style={hostStyle}
      >
        {Body && (
          <View
            testID="tentap-custom-keyboard"
            style={[
              styles.body,
              {
                top: body.top,
                height: body.height,
                paddingBottom: body.paddingBottom,
                backgroundColor:
                  rootBackground ??
                  resolveColorKeyboardTheme(editor.theme).keyboardRootColor,
              },
            ]}
          >
            <Body
              editor={editor}
              close={close}
              keyboardHeight={view.keyboardHeight}
            />
          </View>
        )}
        {Platform.OS === 'android' && (
          <HiddenFocusInput
            ref={hiddenInputRef}
            autoCorrect={false}
            contextMenuHidden
          />
        )}
      </View>
    </CustomKeyboardContext.Provider>
  );
};

/**
 * Dev warning: the inline slot must end at the bottom of the window (inside a
 * bottom-anchored `KeyboardAvoidingView`), or the keyboard floats above it.
 */
const usePlacementCheck = (
  phase: string | undefined,
  hostRef: RefObject<View | null>,
  windowHeight: number
) => {
  const warned = useRef(false);
  useEffect(() => {
    if (phase !== 'open' || warned.current) return;
    const timer = setTimeout(() => {
      hostRef.current?.measureInWindow((_x, y, _width, height) => {
        if (warned.current || Math.abs(y + height - windowHeight) <= 1) {
          return;
        }
        warned.current = true;
        console.warn(
          `[TenTap] CustomKeyboard ends ${Math.round(windowHeight - y - height)}pt above the bottom of the window. ` +
            'Render it last inside a KeyboardAvoidingView anchored to the bottom, or use layout="overlay".'
        );
      });
    }, PLACEMENT_CHECK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase, hostRef, windowHeight]);
};

const styles = StyleSheet.create({
  overlayHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  body: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
});

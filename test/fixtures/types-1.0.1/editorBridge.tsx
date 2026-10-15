// 1.0.1 call sites of useEditorBridge, the EditorBridge methods and the hooks.
import React from 'react';
import type { RefObject } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type WebView from 'react-native-webview';
import {
  CoreBridge,
  EditorHelper,
  ImageBridge,
  LinkBridge,
  PlaceholderBridge,
  RichText,
  TenTapStartKit,
  darkEditorCss,
  darkEditorTheme,
  editorHtml,
  uniqueBy,
  useBridgeState,
  useEditorBridge,
  useEditorContent,
  useKeyboard,
  type BridgeState,
  type EditorBridge,
  type EditorContentType,
} from '@10play/tentap-editor';
import { expectAssignable, expectType } from '../typeAssert';

export const AllOptions = () => {
  const editor = useEditorBridge({
    bridgeExtensions: [
      ...TenTapStartKit,
      CoreBridge.configureCSS(darkEditorCss),
      PlaceholderBridge.configureExtension({ placeholder: 'Type...' }),
      LinkBridge.configureExtension({ openOnClick: false }),
      ImageBridge.configureExtension({ inline: true }),
    ],
    initialContent: '<p>Hello</p>',
    autofocus: true,
    avoidIosKeyboard: true,
    customSource: editorHtml,
    webviewBaseURL: 'file:///',
    dynamicHeight: true,
    disableColorHighlight: false,
    editable: true,
    onChange: () => {},
    DEV: false,
    DEV_SERVER_URL: 'http://localhost:3000',
    theme: darkEditorTheme,
  });
  const fromJson = useEditorBridge({
    initialContent: { type: 'doc', content: [] },
    theme: { toolbar: { toolbarBody: { borderTopWidth: 0 } } },
  });
  const defaults = useEditorBridge();
  expectAssignable<EditorBridge>(editor);

  return (
    <View>
      <RichText editor={editor} />
      <RichText
        editor={fromJson}
        exclusivelyUseCustomOnMessage={false}
        onMessage={(event) => event.nativeEvent.data}
        onLoad={() => {}}
        style={styles.fill}
        containerStyle={styles.fill}
      />
      <RichText editor={defaults} />
    </View>
  );
};

const styles = StyleSheet.create({ fill: { flex: 1 } });

export const bridgeMethods = async (editor: EditorBridge) => {
  expectType<Promise<string>>()(editor.getHTML());
  expectType<Promise<object>>()(editor.getJSON());
  expectType<Promise<string>>()(editor.getText());

  const html: string = await editor.getHTML();
  const json: object = await editor.getJSON();
  const text: string = await editor.getText();
  editor.setContent(html);
  editor.setContent(json);
  editor.setContent({ type: 'doc', content: [{ type: 'paragraph' }] });
  editor.setContent(text);
  editor.setSelection(0, 1);
  editor.updateScrollThresholdAndMargin(44);
  editor.focus();
  editor.focus('start');
  editor.focus('end');
  editor.focus('all');
  editor.focus(3);
  editor.focus(true);
  editor.focus(null);
  editor.blur();
  editor.injectJS('window.foo = 1;');
  editor.injectCSS('p { color: red; }');
  editor.injectCSS('p { color: red; }', 'my-tag');
  editor.setEditable(false);
  expectAssignable<object>(editor.theme.toolbar);

  editor.toggleBold();
  editor.toggleItalic();
  editor.toggleStrike();
  editor.toggleUnderline();
  editor.toggleCode();
  editor.toggleBlockquote();
  editor.toggleHeading(1);
  editor.toggleHeading(6);
  editor.toggleBulletList();
  editor.toggleOrderedList();
  editor.lift();
  editor.sink();
  editor.toggleTaskList();
  editor.liftTaskListItem();
  editor.sinkTaskListItem();
  editor.undo();
  editor.redo();
  editor.setLink('https://10play.dev');
  editor.setLink('');
  editor.setLink(null);
  editor.setColor('#ff0000');
  editor.unsetColor();
  editor.setHighlight('#ffff00');
  editor.toggleHighlight('#ffff00');
  editor.unsetHighlight();
  editor.setImage('https://10play.dev/image.png');
  editor.setPlaceholder('Write something');
  editor.setHardBreak();

  const fields: {
    autofocus: boolean;
    initialContent?: string;
    editable?: boolean;
    webviewRef: RefObject<WebView>;
  } = editor;
  const state: BridgeState = editor.getEditorState();
  const unsubscribeState: () => void = editor._subscribeToEditorStateUpdate(
    (next) => next.isReady
  );
  const unsubscribeContent: () => void = editor._subscribeToContentUpdate(
    () => {}
  );
  editor._updateEditorState(state);
  editor._onContentUpdate();
  editor._onContentHeightUpdate(100);
  return { fields, unsubscribeState, unsubscribeContent };
};

export const bridgeStateFields = (state: BridgeState) => {
  const core: {
    selection: { from: number; to: number };
    isFocused: boolean;
    isReady: boolean;
    editable: boolean;
    empty: boolean;
  } = state;
  const marks: boolean[] = [
    state.isBoldActive,
    state.canToggleBold,
    state.isItalicActive,
    state.canToggleItalic,
    state.isStrikeActive,
    state.canToggleStrike,
    state.isUnderlineActive,
    state.canToggleUnderline,
    state.isCodeActive,
    state.canToggleCode,
    state.isBlockquoteActive,
    state.canToggleBlockquote,
    state.isBulletListActive,
    state.canToggleBulletList,
    state.isOrderedListActive,
    state.canToggleOrderedList,
    state.isTaskListActive,
    state.canToggleTaskList,
    state.canLiftTaskListItem,
    state.canSinkTaskListItem,
    state.canToggleHeading,
    state.canLift,
    state.canSink,
    state.canUndo,
    state.canRedo,
    state.isLinkActive,
    state.canSetLink,
  ];
  const optional: (string | number | undefined)[] = [
    state.headingLevel,
    state.activeLink,
    state.activeColor,
    state.activeHighlight,
  ];
  return { core, marks, optional };
};

export const Hooks = ({ editor }: { editor: EditorBridge }) => {
  const state = useBridgeState(editor);
  const html = useEditorContent(editor);
  const text = useEditorContent(editor, { type: 'text' });
  const json = useEditorContent(editor, { type: 'json', debounceInterval: 50 });
  const { isKeyboardUp, keyboardHeight } = useKeyboard();
  expectType<BridgeState>()(state);
  // Without `type`, 1.0.1 infers the union; narrowing it is compatible.
  expectAssignable<string | object | undefined>(html);
  expectType<string | undefined>()(text);
  expectType<object | undefined>()(json);
  const contentType: EditorContentType = 'html';

  return (
    <Text>
      {JSON.stringify(html)}
      {text}
      {JSON.stringify(json)}
      {String(isKeyboardUp)}
      {keyboardHeight}
      {contentType}
    </Text>
  );
};

export const helpers = () => {
  const last: EditorBridge | undefined = EditorHelper.editorLastInstance;
  const unsubscribe: () => void = EditorHelper.subscribe((editor) => editor);
  if (last) EditorHelper.setEditorLastInstance(last);
  const unique = uniqueBy(TenTapStartKit, 'name');
  const byFn = uniqueBy(TenTapStartKit, (bridge) => bridge.name);
  return { unsubscribe, unique, byFn };
};

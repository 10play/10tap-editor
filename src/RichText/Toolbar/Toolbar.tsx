import React from 'react';
import {
  FlatList,
  Platform,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useBridgeState } from '../useBridgeState';
import {
  DEFAULT_TOOLBAR_ITEMS,
  HEADING_ITEMS,
  STICKY_KEYBOARD,
  TOOLBAR_SECTIONS,
  type ToolbarItem,
  type ToolbarSection,
} from './actions';
import { EditLinkBar } from './EditLinkBar';
import { useKeyboard } from '../../utils';
import type { EditorBridge } from '../../types';
import { ToolbarItemComp } from './ToolbarItemComp';
import { WebToolbar } from './WebToolbar';
import { Separator } from './Separator';

interface ToolbarProps {
  editor: EditorBridge;
  hidden?: boolean;
  items?: ToolbarItem[];
  sections?: Record<string, ToolbarSection>;
  itemRenderer?: (item: ToolbarItem) => React.ReactNode | null;
  showStickyKeyboard?: boolean;
  stickyKeyboardPosition?: 'left' | 'right';
}

export enum ToolbarContext {
  Main,
  Link,
  Heading,
}

export function Toolbar({
  editor,
  hidden = undefined,
  items = DEFAULT_TOOLBAR_ITEMS,
  sections = TOOLBAR_SECTIONS,
  itemRenderer,
  showStickyKeyboard = false,
  stickyKeyboardPosition = 'right',
}: ToolbarProps) {
  const editorState = useBridgeState(editor);
  const { isKeyboardUp } = useKeyboard();
  const [toolbarContext, setToolbarContext] = React.useState<ToolbarContext>(
    ToolbarContext.Main
  );
  const [isStickyKeyboardActive, setIsStickyKeyboardActive] =
    React.useState(false);

  const hideToolbar =
    hidden === undefined ? !isKeyboardUp || !editorState.isFocused : hidden;

  const args = {
    editor,
    editorState,
    setToolbarContext,
    toolbarContext,
  };

  const renderSection = ({
    section,
    isLast,
  }: {
    section: ToolbarSection;
    isLast: boolean;
  }) => (
    <>
      <View style={editor.theme.toolbar.section}>
        {section.items.map((item, index) => (
          <ToolbarItemComp key={index} {...item} args={args} editor={editor} />
        ))}
      </View>
      {!isLast && <Separator />}
    </>
  );

  const getSectionsWithSeparators = () => {
    const sectionEntries = Object.entries(
      toolbarContext === ToolbarContext.Heading
        ? { heading: { items: HEADING_ITEMS } }
        : sections
    );
    return sectionEntries.map((entry, index) => ({
      key: entry[0],
      section: entry[1],
      isLast: index === sectionEntries.length - 1,
    }));
  };

  const renderStickyKeyboard = () => (
    <TouchableOpacity
      style={[
        editor.theme.toolbar.toolbarButton,
        editor.theme.toolbar.stickyKeyboardContainer,
      ]}
      onPress={() => {
        setIsStickyKeyboardActive(!isStickyKeyboardActive);
        STICKY_KEYBOARD.onPress(args)();
      }}
    >
      <View
        style={[
          editor.theme.toolbar.iconWrapper,
          isStickyKeyboardActive && editor.theme.toolbar.iconWrapperActive,
        ]}
      >
        <Image
          source={STICKY_KEYBOARD.image(args)}
          style={[
            editor.theme.toolbar.icon,
            isStickyKeyboardActive && editor.theme.toolbar.iconActive,
          ]}
        />
      </View>
    </TouchableOpacity>
  );

  const renderToolbar = () => (
    <View style={editor.theme.toolbar.toolbarBody}>
      {showStickyKeyboard &&
        stickyKeyboardPosition === 'left' &&
        renderStickyKeyboard()}
      <FlatList
        data={getSectionsWithSeparators()}
        style={[
          editor.theme.toolbar.flatList,
          hideToolbar && editor.theme.toolbar.hidden,
        ]}
        renderItem={({ item }) => renderSection(item)}
        keyExtractor={(item) => item.key}
        horizontal
      />
      {showStickyKeyboard &&
        stickyKeyboardPosition === 'right' &&
        renderStickyKeyboard()}
    </View>
  );

  switch (toolbarContext) {
    case ToolbarContext.Main:
    case ToolbarContext.Heading:
      if (Platform.OS === 'web') {
        return (
          <WebToolbar
            items={
              toolbarContext === ToolbarContext.Main ? items : HEADING_ITEMS
            }
            args={args}
            editor={editor}
            hidden={hidden}
            sections={sections}
            itemRenderer={itemRenderer}
          />
        );
      }
      return renderToolbar();
    case ToolbarContext.Link:
      return (
        <EditLinkBar
          theme={editor.theme}
          initialLink={editorState.activeLink}
          onBlur={() => setToolbarContext(ToolbarContext.Main)}
          onLinkIconClick={() => {
            setToolbarContext(ToolbarContext.Main);
            editor.focus();
          }}
          onEditLink={(link) => {
            editor.setLink(link);
            editor.focus();

            if (Platform.OS === 'android') {
              // On android we dont want to hide the link input before we finished focus on editor
              // Add here 100ms and we can try to find better solution later
              setTimeout(() => {
                setToolbarContext(ToolbarContext.Main);
              }, 100);
            } else {
              setToolbarContext(ToolbarContext.Main);
            }
          }}
        />
      );
  }
}

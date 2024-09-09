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
  STICKY_KEYBOARD,
  DEFAULT_TOOLBAR_ITEMS,
  TOOLBAR_SECTIONS,
  HEADING_ITEMS,
} from './actions';
import { useKeyboard } from '../../utils';
import { ToolbarItemComp } from './ToolbarItemComp';
import { WebToolbar } from './WebToolbar';
import { Separator } from './Separator';
import { EditLinkBar } from './EditLinkBar';
import type {
  ToolbarProps,
  ToolbarSection,
  ArgsToolbarCB,
  ToolbarContextConfig,
} from './ToolbarTypes';

export type ToolbarContext = 'Main' | 'Link' | 'Heading' | string;

export function Toolbar({
  editor,
  hidden = undefined,
  items = DEFAULT_TOOLBAR_ITEMS,
  sections = TOOLBAR_SECTIONS,
  contexts = {},
  showStickyKeyboard = false,
  stickyKeyboardPosition = 'right',
}: ToolbarProps) {
  const editorState = useBridgeState(editor);
  const { isKeyboardUp } = useKeyboard();
  const [toolbarContext, setToolbarContext] =
    React.useState<ToolbarContext>('Main');
  const [isStickyKeyboardActive, setIsStickyKeyboardActive] =
    React.useState(false);

  const hideToolbar =
    hidden === undefined ? !isKeyboardUp || !editorState.isFocused : hidden;

  const args: ArgsToolbarCB = {
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

  const getSectionsWithSeparators = (
    sectionsToUse: Record<string, ToolbarSection>
  ) => {
    const sectionEntries = Object.entries(sectionsToUse);
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
      <View style={editor.theme.toolbar.iconWrapper}>
        <Image
          source={STICKY_KEYBOARD.image(args)}
          style={editor.theme.toolbar.icon}
        />
      </View>
    </TouchableOpacity>
  );

  const renderToolbarContent = () => {
    const currentContext: ToolbarContextConfig | undefined =
      contexts[toolbarContext];

    if (currentContext) {
      if (currentContext.component) {
        const CustomComponent = currentContext.component;
        return <CustomComponent {...args} />;
      }
      if (currentContext.sections) {
        return (
          <FlatList
            data={getSectionsWithSeparators(currentContext.sections)}
            style={[
              editor.theme.toolbar.flatList,
              hideToolbar && editor.theme.toolbar.hidden,
            ]}
            renderItem={({ item }) => renderSection(item)}
            keyExtractor={(item) => item.key}
            horizontal
          />
        );
      }
    }

    // Fallback to default behavior for Main context and undefined contexts
    const sectionsToUse =
      toolbarContext === 'Main'
        ? sections
        : toolbarContext === 'Heading'
        ? { heading: { items: HEADING_ITEMS } }
        : {};
    return (
      <FlatList
        data={getSectionsWithSeparators(sectionsToUse)}
        scrollIndicatorInsets={{ bottom: -3 }}
        style={[
          editor.theme.toolbar.flatList,
          hideToolbar && editor.theme.toolbar.hidden,
        ]}
        renderItem={({ item }) => renderSection(item)}
        keyExtractor={(item) => item.key}
        horizontal
      />
    );
  };

  if (Platform.OS === 'web') {
    const currentContext = contexts[toolbarContext];
    const webItems = currentContext?.sections
      ? Object.values(currentContext.sections).flatMap(
          (section) => section.items
        )
      : toolbarContext === 'Main'
      ? items
      : toolbarContext === 'Heading'
      ? HEADING_ITEMS
      : [];

    return (
      <WebToolbar
        items={webItems}
        args={args}
        editor={editor}
        hidden={hidden}
        sections={
          currentContext?.sections ||
          (toolbarContext === 'Main' ? sections : undefined)
        }
      />
    );
  }

  if (toolbarContext === 'Link') {
    return (
      <EditLinkBar
        theme={editor.theme}
        initialLink={editorState.activeLink}
        onBlur={() => setToolbarContext('Main')}
        onLinkIconClick={() => {
          setToolbarContext('Main');
          editor.focus();
        }}
        onEditLink={(link) => {
          editor.setLink(link);
          editor.focus();

          if (Platform.OS === 'android') {
            // On android we dont want to hide the link input before we finished focus on editor
            // Add here 100ms and we can try to find better solution later
            setTimeout(() => {
              setToolbarContext('Main');
            }, 100);
          } else {
            setToolbarContext('Main');
          }
        }}
      />
    );
  }

  return (
    <View style={editor.theme.toolbar.toolbarBody}>
      {showStickyKeyboard &&
        stickyKeyboardPosition === 'left' &&
        renderStickyKeyboard()}
      {renderToolbarContent()}
      {showStickyKeyboard &&
        stickyKeyboardPosition === 'right' &&
        renderStickyKeyboard()}
    </View>
  );
}

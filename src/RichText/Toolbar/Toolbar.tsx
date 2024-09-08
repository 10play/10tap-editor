import { FlatList, StyleSheet, Platform, View } from 'react-native';
import { useBridgeState } from '../useBridgeState';
import React from 'react';
import {
  DEFAULT_TOOLBAR_ITEMS,
  HEADING_ITEMS,
  type ToolbarItem,
  type ToolbarSection,
} from './actions';
import { EditLinkBar } from './EditLinkBar';
import { useKeyboard } from '../../utils';
import type { EditorBridge } from '../../types';
import { ToolbarItemComp } from './ToolbarItemComp';
import { WebToolbar } from './WebToolbar';

interface ToolbarProps {
  editor: EditorBridge;
  hidden?: boolean;
  items?: ToolbarItem[];
  sections?: Record<string, ToolbarSection>;
  itemRenderer?: (item: ToolbarItem) => React.ReactNode | null;
}

export const toolbarStyles = StyleSheet.create({});

export enum ToolbarContext {
  Main,
  Link,
  Heading,
}

type ToolbarSectionData = {
  key: string;
  section: ToolbarSection;
};

export function Toolbar({
  editor,
  hidden = undefined,
  items = DEFAULT_TOOLBAR_ITEMS,
  sections,
  itemRenderer,
}: ToolbarProps) {
  const editorState = useBridgeState(editor);
  const { isKeyboardUp } = useKeyboard();
  const [toolbarContext, setToolbarContext] = React.useState<ToolbarContext>(
    ToolbarContext.Main
  );

  const hideToolbar =
    hidden === undefined ? !isKeyboardUp || !editorState.isFocused : hidden;

  const args = {
    editor,
    editorState,
    setToolbarContext,
    toolbarContext,
  };

  const renderSection = ({ key, section }: ToolbarSectionData) => {
    if (section.sectionComponent) {
      // If a custom section component exists, render it
      const SectionComponent = section.sectionComponent;
      return (
        <SectionComponent
          key={key}
          items={section.items}
          itemRenderer={itemRenderer}
        />
      );
    }
    // Otherwise, render the default section with toolbar items
    return (
      <View key={key} style={styles.section}>
        {section.items.map((item, index) => (
          <React.Fragment key={index}>
            {itemRenderer ? itemRenderer(item) : renderDefaultItem(item, index)}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const renderDefaultItem = (item: ToolbarItem, index: number) => (
    <ToolbarItemComp key={index} {...item} args={args} editor={editor} />
  );

  // Get toolbar items based on the current context
  const getToolbarItems = (): ToolbarItem[] => {
    if (toolbarContext === ToolbarContext.Heading) {
      return HEADING_ITEMS;
    }
    if (sections) {
      return Object.values(sections).flatMap((section) => section.items);
    }
    return items;
  };

  const getFlatListData = (): ToolbarSectionData[] => {
    if (sections) {
      return Object.entries(sections).map(([key, section]) => ({
        key,
        section,
      }));
    }
    return [{ key: 'default', section: { items: getToolbarItems() } }];
  };

  switch (toolbarContext) {
    case ToolbarContext.Main:
    case ToolbarContext.Heading:
      if (Platform.OS === 'web') {
        return (
          <WebToolbar
            items={getToolbarItems()}
            args={args}
            editor={editor}
            hidden={hidden}
            sections={sections}
            itemRenderer={itemRenderer}
          />
        );
      }
      return (
        <FlatList<ToolbarSectionData>
          data={getFlatListData()}
          style={[
            editor.theme.toolbar.toolbarBody,
            hideToolbar ? editor.theme.toolbar.hidden : undefined,
          ]}
          renderItem={({ item }) => renderSection(item)}
          keyExtractor={(item) => item.key}
          horizontal
        />
      );
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

const styles = StyleSheet.create({
  section: {
    flexDirection: 'row',
  },
});

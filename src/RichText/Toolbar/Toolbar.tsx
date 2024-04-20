import {
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  View,
} from 'react-native';
import { useBridgeState } from '../useBridgeState';
import React from 'react';
import {
  DEFAULT_TOOLBAR_ITEMS,
  HEADING_ITEMS,
  type ToolbarItem,
} from './actions';
import { EditLinkBar } from './EditLinkBar';
import { useKeyboard } from '../../utils';
import type { EditorBridge } from '../../types';

import { Foundation } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';

interface ToolbarProps {
  editor: EditorBridge;
  hidden?: boolean;
  items?: ToolbarItem[];
}

export const toolbarStyles = StyleSheet.create({});

export enum ToolbarContext {
  Main,
  Link,
  Heading,
}

export function Toolbar({
  editor,
  hidden = undefined,
  items = DEFAULT_TOOLBAR_ITEMS,
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

  switch (toolbarContext) {
    case ToolbarContext.Main:
    case ToolbarContext.Heading:
      return (

        <FlatList
          data={toolbarContext === ToolbarContext.Main ? items : HEADING_ITEMS}
          style={[
            editor.theme.toolbar.toolbarBody,
            hideToolbar ? editor.theme.toolbar.hidden : undefined,
            {}
          ]}
          // contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center'}} // aqui centralizo a barra
          renderItem={({ item: { onPress, disabled, active, image } }) => {
            // console.log(image(args))
            let iconRender: React.ReactNode | null = null;
            switch (image(args)) {
              case 24: // bold
                iconRender = active(args) ? <FontAwesome5 name="bold" size={18} color="red" /> : <FontAwesome5 name="bold" size={18} color="black" />
                break;
              case 25: // italic
                iconRender = active(args) ? <FontAwesome5 name="italic" size={18} color="red" /> : <FontAwesome5 name="italic" size={18} color="black" />
                break;
              case 26: // underline
                iconRender = active(args) ? <FontAwesome5 name="underline" size={18} color="red" /> : <FontAwesome5 name="underline" size={18} color="black" />
                break;
              case 27: // strikethrough
                iconRender = active(args) ? <FontAwesome5 name="strikethrough" size={18} color="red" /> : <FontAwesome5 name="strikethrough" size={18} color="black" />
                break;
              case 34: // orderedList -- checar se consigo alterar as cores disso
                iconRender = active(args) ? <FontAwesome5 name="list-ol" size={18} color="red" /> : <FontAwesome5 name="list-ol" size={18} color="black" />
                break;
              case 35: // bulletList -- checar se consigo alterar as cores disso
                iconRender = active(args) ? <FontAwesome5 name="list-ul" size={18} color="red" /> : <FontAwesome5 name="list-ul" size={18} color="black" />
                break;
              case 37: // undo -- checar se consigo alterar as cores quando ele está desativado
                iconRender = active(args) ? <FontAwesome5 name="undo" size={18} color="red" /> : <FontAwesome5 name="undo" size={18} color="black" />
                break;
              case 38: // redo -- checar se consigo alterar as cores quando ele está desativado
                iconRender = active(args) ? <FontAwesome5 name="redo" size={18} color="red" /> : <FontAwesome5 name="redo" size={18} color="black" />
                break;
            }
            return (
              <TouchableOpacity
                onPress={onPress(args)}
                disabled={disabled(args)}
                style={[editor.theme.toolbar.toolbarButton]}
              >
                <View
                  style={[
                    editor.theme.toolbar.iconWrapper,
                    active(args)
                      ? editor.theme.toolbar.iconWrapperActive
                      : undefined,
                    disabled(args)
                      ? editor.theme.toolbar.iconWrapperDisabled
                      : undefined,                    
                  ]}
                >
                  {/* {valorBooleano && <Text>O valor é verdadeiro!</Text>} */}
                  {/* {
                    image(args) === 24 ? 
                    (
                      active(args) ? (<Foundation name="burst" size={24} color="red" />) : (<Foundation name="burst" size={24} color="black" />)
                    ) :
                    (
                      <Image
                        source={image(args)}
                        style={[editor.theme.toolbar.icon]}
                        resizeMode="contain"
                      />
                    )
                  } */}
                  {iconRender}

                </View>
              </TouchableOpacity>
            );
          }}
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

import { type RefObject, useRef } from 'react';
import WebView from 'react-native-webview';
import {
  type EditorActionMessage,
  EditorMessageType,
} from '../types/Messaging';
import {
  type EditorAction,
  type Level,
  EditorActionType,
} from '../types/Actions';
import { type EditorState } from '../types/EditorState';

type Subscription<T> = (cb: (val: T) => void) => () => void;
export interface Editor {
  webviewRef: RefObject<WebView>;
  editLink: (newLink: string) => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  toggleStrikethrough: () => void;
  toggleBulletList: () => void;
  toggleOrderedList: () => void;
  toggleCheckList: () => void;
  toggleHeading: (level: Level) => void;
  lift: () => void;
  sink: () => void;
  undo: () => void;
  redo: () => void;
  getEditorState: () => EditorState;
  _updateEditorState: (state: EditorState) => void;
  _subscribeToEditorStateUpdate: Subscription<EditorState>;
}

const DEFAULT_STATE: EditorState = {
  activeLink: undefined,
  canAddLink: false,
  isLinkActive: false,
  canToggleBold: false,
  canToggleItalic: false,
  canToggleUnderline: false,
  canToggleStrikethrough: false,
  canToggleBulletList: false,
  canToggleOrderedList: false,
  canToggleCheckList: false,
  canToggleHeading: false,
  canLift: false,
  canSink: false,
  canUndo: false,
  canRedo: false,
  isBoldActive: false,
  isItalicActive: false,
  isUnderlineActive: false,
  isBulletListActive: false,
  isOrderedListActive: false,
  isCheckListActive: false,
  isStrikethroughActive: false,
  headingLevel: undefined,
};
export const useEditor = (): Editor => {
  const webviewRef = useRef<WebView>(null);
  const editorStateRef = useRef<EditorState>(DEFAULT_STATE);
  const editorStateSubsRef = useRef<((state: EditorState) => void)[]>([]);

  const _updateEditorState = (editorState: EditorState) => {
    editorStateRef.current = editorState;
    editorStateSubsRef.current.forEach((sub) => sub(editorState));
  };

  const _subscribeToEditorStateUpdate: Subscription<EditorState> = (cb) => {
    editorStateSubsRef.current.push(cb);
    return () => {
      editorStateSubsRef.current = editorStateSubsRef.current.filter(
        (sub) => sub !== cb
      );
    };
  };

  const getEditorState = () => {
    return editorStateRef.current;
  };

  const sendMessage = (message: EditorActionMessage) => {
    // TODO editor ready check
    if (!webviewRef.current) return console.warn("Editor isn't ready yet");
    webviewRef.current?.postMessage(JSON.stringify(message));
  };

  const sendAction = (action: EditorAction) => {
    sendMessage({
      type: EditorMessageType.Action,
      payload: action,
    });
  };

  const toggleBold = () => sendAction({ type: EditorActionType.ToggleBold });
  const toggleItalic = () =>
    sendAction({ type: EditorActionType.ToggleItalic });
  const toggleUnderline = () =>
    sendAction({ type: EditorActionType.ToggleUnderline });
  const toggleStrikethrough = () =>
    sendAction({ type: EditorActionType.ToggleStrikethrough });
  const toggleBulletList = () =>
    sendAction({ type: EditorActionType.ToggleBulletList });
  const toggleOrderedList = () =>
    sendAction({ type: EditorActionType.ToggleOrderedList });
  const toggleCheckList = () =>
    sendAction({ type: EditorActionType.ToggleCheckList });
  const toggleHeading = (level: Level) =>
    sendAction({ type: EditorActionType.ToggleHeading, payload: level });
  const lift = () => sendAction({ type: EditorActionType.Lift });
  const sink = () => sendAction({ type: EditorActionType.Sink });
  const undo = () => sendAction({ type: EditorActionType.Undo });
  const redo = () => sendAction({ type: EditorActionType.Redo });
  const editLink = (newLink: string) =>
    sendAction({ type: EditorActionType.Link, payload: newLink });

  return {
    webviewRef,
    editLink,
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleStrikethrough,
    toggleBulletList,
    toggleOrderedList,
    toggleCheckList,
    toggleHeading,
    lift,
    sink,
    undo,
    redo,
    getEditorState,
    _updateEditorState,
    _subscribeToEditorStateUpdate,
  };
};

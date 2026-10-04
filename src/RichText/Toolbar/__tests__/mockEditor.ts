import { defaultEditorTheme } from '../../theme';
import type { BridgeState, EditorBridge, EditorTheme } from '../../../types';

const ALL_ENABLED: Partial<BridgeState> = {
  isFocused: true,
  selection: { from: 1, to: 4 },
  activeLink: undefined,
  headingLevel: undefined,
  canToggleBold: true,
  canToggleItalic: true,
  canSetLink: true,
  canToggleTaskList: true,
  canToggleHeading: true,
  canToggleCode: true,
  canToggleUnderline: true,
  canToggleStrike: true,
  canToggleBlockquote: true,
  canToggleOrderedList: true,
  canToggleBulletList: true,
  canSink: true,
  canLift: true,
  canUndo: true,
  canRedo: true,
};

const COMMANDS = [
  'focus',
  'setLink',
  'setSelection',
  'toggleBold',
  'toggleHeading',
] as const;

type Command = (typeof COMMANDS)[number];

export type MockEditor = EditorBridge &
  Record<Command, jest.Mock> & {
    theme: EditorTheme;
    /** Publishes a new bridge state to subscribers; wrap it in act(). */
    emitState: (patch: Partial<BridgeState>) => void;
  };

export const createMockEditor = (
  initial: Partial<BridgeState> = {},
  theme: EditorTheme = defaultEditorTheme
): MockEditor => {
  let state = { ...ALL_ENABLED, ...initial } as BridgeState;
  const listeners = new Set<(s: BridgeState) => void>();
  const commands = Object.fromEntries(
    COMMANDS.map((name) => [name, jest.fn()])
  ) as Record<Command, jest.Mock>;

  const editor = {
    ...commands,
    theme,
    getEditorState: () => state,
    _subscribeToEditorStateUpdate: (cb: (s: BridgeState) => void) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    emitState: (patch: Partial<BridgeState>) => {
      state = { ...state, ...patch } as BridgeState;
      listeners.forEach((cb) => cb(state));
    },
  };
  return editor as unknown as MockEditor;
};

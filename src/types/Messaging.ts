import type { EditorAction } from './Actions';
import type { EditorState } from './EditorState';

export enum EditorMessageType {
  Action = 'action',
  StateUpdate = 'stateUpdate',
}

export interface EditorActionMessage {
  type: EditorMessageType.Action;
  payload: EditorAction;
}

export interface EditorStateUpdateMessage {
  type: EditorMessageType.StateUpdate;
  payload: EditorState;
}

export type EditorMessage = EditorActionMessage | EditorStateUpdateMessage;

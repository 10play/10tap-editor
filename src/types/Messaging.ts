import type { EditorState } from './EditorState';

export enum EditorMessageType {
  Action = 'action',
  StateUpdate = 'stateUpdate',
  EditorReady = 'editor-ready',
}

export interface EditorActionMessage {
  type: EditorMessageType.Action | EditorMessageType.EditorReady;
  payload: any;
}

export interface EditorStateUpdateMessage {
  type: EditorMessageType.StateUpdate;
  payload: EditorState;
}

export type EditorMessage = EditorActionMessage | EditorStateUpdateMessage;

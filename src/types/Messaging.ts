import type { EditorNativeState } from './EditorNativeState';

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
  payload: EditorNativeState;
}

export type EditorMessage = EditorActionMessage | EditorStateUpdateMessage;

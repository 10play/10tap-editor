import type { CoreMessages } from '../bridges/core';
export enum EditorMessageType {
  Action = 'action',
}

export interface EditorActionMessage {
  type: EditorMessageType.Action;
  payload: any;
}

export type EditorMessage = EditorActionMessage | CoreMessages;

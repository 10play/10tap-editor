import type { CoreMessages } from '../bridges/core';
export enum EditorMessageType {
  Action = 'action',
}

export interface EditorActionMessage {
  type: EditorMessageType.Action;
  payload: any;
  id?: string; // Temporary, android new arch only
}

export type EditorMessage = EditorActionMessage | CoreMessages;

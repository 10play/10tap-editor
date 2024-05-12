export enum EditorActionType {
  ChangeHighlight = 'change-highlight',
  ChangeColor = 'change-color',
  Link = 'link',
  ToggleUnderline = 'toggle-underline',
  SetHardBreak = 'set-hard-break',
  // start
}
// Actions with no payload
type RegularActions =
  | EditorActionType.ChangeHighlight
  | EditorActionType.ChangeColor
  | EditorActionType.Link
  | EditorActionType.ToggleUnderline
  | EditorActionType.SetHardBreak;

export interface RegularAction {
  type: RegularActions;
  payload?: any;
}

export enum EditorUpdateSettings {
  Focus = 'focus',
}

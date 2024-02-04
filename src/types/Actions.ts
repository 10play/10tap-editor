export enum EditorActionType {
  ChangeHighlight = 'change-highlight',
  ChangeColor = 'change-color',
  Link = 'link',
  ToggleUnderline = 'toggle-underline',
  // start
}
// Actions with no payload
type RegularActions =
  | EditorActionType.ChangeHighlight
  | EditorActionType.ChangeColor
  | EditorActionType.Link
  | EditorActionType.ToggleUnderline;

export interface RegularAction {
  type: RegularActions;
  payload?: any;
}

export enum EditorUpdateSettings {
  UpdateScrollThresholdAndMargin = 'update-scroll-threshold-and-margin',
  Focus = 'focus',
}

type EditorUpdateSettingsActions =
  EditorUpdateSettings.UpdateScrollThresholdAndMargin;
export interface EditorUpdateSettingsAction {
  type: EditorUpdateSettingsActions;
  payload?: any;
}

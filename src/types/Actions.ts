export enum EditorActionType {
  ChangeHighlight = 'change-highlight',
  ChangeColor = 'change-color',
  Link = 'link',
  ToggleUnderline = 'toggle-underline',
  ToggleCheckList = 'toggle-check-list',
  // start
}
// Actions with no payload
type RegularActions =
  | EditorActionType.ChangeHighlight
  | EditorActionType.ChangeColor
  | EditorActionType.Link
  | EditorActionType.ToggleCheckList
  | EditorActionType.ToggleUnderline;

export interface RegularAction {
  type: RegularActions;
  payload?: any;
}

export enum EditorUpdateSettings {
  UpdateScrollThresholdAndMargin = 'update-scroll-threshold-and-margin',
}

type EditorUpdateSettingsActions =
  EditorUpdateSettings.UpdateScrollThresholdAndMargin;
export interface EditorUpdateSettingsAction {
  type: EditorUpdateSettingsActions;
  payload?: any;
}

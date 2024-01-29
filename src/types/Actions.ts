export enum EditorActionType {
  ChangeHighlight = 'change-highlight',
  ChangeColor = 'change-color',
  Link = 'link',
  ToggleBold = 'toggle-bold',
  ToggleItalic = 'toggle-italic',
  ToggleUnderline = 'toggle-underline',
  ToggleStrikethrough = 'toggle-strikethrough',
  ToggleHeading = 'toggle-heading',
  ToggleOrderedList = 'toggle-ordered-list',
  ToggleBulletList = 'toggle-bullet-list',
  ToggleCheckList = 'toggle-check-list',
  Lift = 'lift',
  Sink = 'sink',
  Undo = 'undo',
  Redo = 'redo',
}
// Actions with no payload
type RegularActions =
  | EditorActionType.ChangeHighlight
  | EditorActionType.ChangeColor
  | EditorActionType.Link
  | EditorActionType.ToggleBold
  | EditorActionType.ToggleItalic
  | EditorActionType.ToggleUnderline
  | EditorActionType.ToggleStrikethrough
  | EditorActionType.ToggleOrderedList
  | EditorActionType.ToggleBulletList
  | EditorActionType.ToggleCheckList
  | EditorActionType.Lift
  | EditorActionType.Sink
  | EditorActionType.Undo
  | EditorActionType.Redo;

export interface RegularAction {
  type: RegularActions;
  payload?: any;
}

export type Level = 2 | 1 | 3 | 4 | 5 | 6;
interface HeadingAction {
  type: EditorActionType.ToggleHeading;
  payload: Level;
}

export type EditorAction = RegularAction | HeadingAction;

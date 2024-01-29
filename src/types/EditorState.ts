export interface EditorState {
  activeHighlight: string | undefined;
  activeColor: string | undefined;
  activeLink: string | undefined;
  canAddLink: boolean;
  canToggleBold: boolean;
  canToggleItalic: boolean;
  canToggleUnderline: boolean;
  canToggleStrikethrough: boolean;
  canLift: boolean;
  canSink: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canToggleHeading: boolean;
  canToggleOrderedList: boolean;
  canToggleBulletList: boolean;
  canToggleCheckList: boolean;
  isFocused: boolean;
  isLinkActive: boolean;
  isBoldActive: boolean;
  isItalicActive: boolean;
  isUnderlineActive: boolean;
  isStrikethroughActive: boolean;
  headingLevel: number | undefined;
  isOrderedListActive: boolean;
  isBulletListActive: boolean;
  isCheckListActive: boolean;
}

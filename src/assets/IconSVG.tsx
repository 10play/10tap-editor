import type { EditorBridge } from '../types';

export function IconSVG({
  editor,
  active,
  disabled,
  icon,
}: {
  editor: EditorBridge;
  active: boolean;
  disabled: boolean;
  icon: any;
}) {
  let iconColor = active
    ? editor.theme.toolbar.iconActive
    : disabled
    ? editor.theme.toolbar.iconDisabled
    : editor.theme.toolbar.icon;

  let iconSize = editor.theme.toolbar.iconSize
    ? editor.theme.toolbar.iconSize
    : 20;

  return icon(iconColor, iconSize);
}

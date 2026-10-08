import {
  CoreBridge,
  TenTapStartKit,
  darkEditorCss,
  darkEditorTheme,
  useEditorBridge,
  type EditorBridgeOptions,
} from '@10play/tentap-editor';
import { useTheme } from './theme';

const editorCss = `
  body {
    font-family: -apple-system, system-ui, Roboto, sans-serif;
    font-size: 17px;
    line-height: 1.45;
  }
`;

const lightBridges = [...TenTapStartKit, CoreBridge.configureCSS(editorCss)];
const darkBridges = [
  ...TenTapStartKit,
  CoreBridge.configureCSS(darkEditorCss + editorCss),
];

/**
 * `useEditorBridge` with the app's font and, in dark mode, the built-in dark
 * theme. Bridges are read once, so App remounts the screen when the color
 * scheme changes.
 */
export const useExampleEditor = (options: EditorBridgeOptions) => {
  const { dark } = useTheme();
  return useEditorBridge({
    ...options,
    bridgeExtensions: dark ? darkBridges : lightBridges,
    theme: dark ? darkEditorTheme : undefined,
  });
};

import React from 'react';
import { createRoot } from 'react-dom/client';
import Tiptap from './Tiptap';

declare global {
  interface Window {
    contentInjected: boolean | undefined;
  }
}

/**
 * On android - react-native-webview there is a bug where sometimes the content is injected https://github.com/react-native-webview/react-native-webview/pull/2960
 * To overcome this we will check if the content is injected before rendering the editor
 */
const contentInjected = () => window.contentInjected;
let interval: NodeJS.Timeout;
interval = setInterval(() => {
  if (!contentInjected()) return;
  // Once content is injected into the webview, we can render the editor
  const container = document.getElementById('root');
  const root = createRoot(container!);
  root.render(<Tiptap />);
  clearInterval(interval);
  return;
}, 1);

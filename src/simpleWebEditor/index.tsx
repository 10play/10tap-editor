import React from 'react';
import { createRoot } from 'react-dom/client';
import { boot } from '../web/runtime';
import Tiptap from './Tiptap';

/**
 * The native side inlines the boot config before this bundle, so the editor
 * normally mounts synchronously. The runtime waits for (and reports) a config
 * that arrives late or never.
 */
const runtime = boot();
runtime.whenConfigured(() => {
  try {
    createRoot(document.getElementById('root')!).render(<Tiptap />);
  } catch (error) {
    runtime.reportBootError(error);
    throw error;
  }
});

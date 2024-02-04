import React from 'react';
import { createRoot } from 'react-dom/client';
import { AdvancedEditor } from './AdvancedEditor';

/**
 * This is the entrypoint for the "web" part of our editor that will be built with vite
 */
const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<AdvancedEditor />);

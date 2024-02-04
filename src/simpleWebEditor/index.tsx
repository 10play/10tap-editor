import React from 'react';
import { createRoot } from 'react-dom/client';
import Tiptap from './Tiptap';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Tiptap />);

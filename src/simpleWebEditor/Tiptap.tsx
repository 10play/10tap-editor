import React from 'react';
import { EditorContent } from '@tiptap/react';
import { CollaborationBridge, useTenTap } from '../webEditorUtils';
import { TenTapStartKit } from '../bridges/StarterKit';

const collaborationEnabled =
  window.bridgeExtensionConfigMap.includes('collaboration');

let tenTapExtensions = TenTapStartKit.filter(
  (e) =>
    !window.whiteListBridgeExtensions ||
    window.whiteListBridgeExtensions.includes(e.name)
);

if (collaborationEnabled) {
  // Add collaboration bridge to the extensions
  tenTapExtensions = [...tenTapExtensions, CollaborationBridge];
}

export default function Tiptap() {
  const editor = useTenTap({ bridges: tenTapExtensions });

  return <EditorContent editor={editor} />;
}

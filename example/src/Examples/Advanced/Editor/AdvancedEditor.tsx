import React from 'react';
import { BubbleMenu, EditorContent } from '@tiptap/react';
import { sendMessage, useTenTap } from 'tentap';

export const AdvancedEditor = () => {
  const editor = useTenTap();
  // alert('ssss')
  return (
    <>
      {editor && (
        <BubbleMenu editor={editor || undefined}>
          <button
            onClick={() =>
              window.ReactNativeWebView?.postMessage(
                JSON.stringify({
                  type: 'new-comment',
                })
              )
            }
          >
            Add comment
          </button>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </>
  );
};

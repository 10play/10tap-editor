import debounce from 'lodash/debounce';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import type { EditorController } from '../shared/contracts';
import type { EditorBridge } from '../types';

export const SNAPSHOT_DEBOUNCE_MS = 500;
export const SNAPSHOT_MAX_WAIT_MS = 2000;

/**
 * Keeps the latest document in the controller, so a WebView that replaces a
 * crashed renderer restores the edits instead of `initialContent`.
 */
export const useContentSnapshot = (
  editor: EditorBridge,
  controller: EditorController
) => {
  const enabled = Platform.OS !== 'web';
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const snapshot = debounce(
      () => {
        const version = controller.getContentVersion();
        editor.getJSON().then(
          (content) => {
            if (active) controller.rememberContent(content, version);
          },
          // Timeouts and unsupported bundles: the next change tries again.
          () => {}
        );
      },
      SNAPSHOT_DEBOUNCE_MS,
      { maxWait: SNAPSHOT_MAX_WAIT_MS }
    );
    const unsubscribe = controller.subscribeContent(snapshot);
    return () => {
      active = false;
      snapshot.cancel();
      unsubscribe();
    };
  }, [controller, editor, enabled]);
};

import type { Listener, Unsubscribe } from '../shared/contracts';

/** How long a WebView that replaces a lost renderer may take to become ready. */
export const REPLACEMENT_READY_TIMEOUT_MS = 5000;
/**
 * Replacements in a row that may fail (time out or lose their renderer too)
 * before recovery waits for the app to come back to the foreground.
 */
export const MAX_UNREADY_REPLACEMENTS = 5;
/** Wait before replacing a replacement that failed; doubles each time. */
export const REPLACEMENT_BACKOFF_MS = 1000;
/** Ceiling of the wait between replacements. */
export const MAX_REPLACEMENT_BACKOFF_MS = 8000;

export interface RendererRecoveryDeps {
  /** Mounts a new WebView (and so a new renderer). */
  replace(): void;
  isReady(): boolean;
  subscribeReady(listener: Listener<boolean>): Unsubscribe;
}

export interface RendererRecovery {
  /** The renderer is gone (a crash event, or a replacement that never got ready). */
  onRendererLost(): void;
  /** The app came back to the foreground: try again after giving up. */
  onForeground(): void;
  /** Whether recovery gave up until the next foreground. */
  isWaitingForForeground(): boolean;
  dispose(): void;
}

export const getReplacementDelay = (failures: number): number =>
  failures <= 0
    ? 0
    : Math.min(
        REPLACEMENT_BACKOFF_MS * 2 ** (failures - 1),
        MAX_REPLACEMENT_BACKOFF_MS
      );

/**
 * Brings the editor back after its WebView renderer is lost (the iOS
 * content process or the Android render process).
 *
 * The first loss is replaced at once. Right after a crash the replacement's
 * renderer can die again or fail to launch without any event (iOS), so a
 * replacement that is not ready in time counts as lost too, and each further
 * replacement in a row waits longer. After `MAX_UNREADY_REPLACEMENTS` of
 * them it stops, so a renderer that keeps crashing never loops, and tries
 * again when the app returns to the foreground. Becoming ready resets it.
 */
export function createRendererRecovery(
  deps: RendererRecoveryDeps
): RendererRecovery {
  // Replacements in a row that have not become ready yet.
  let replacements = 0;
  let waitingForForeground = false;
  let pending: ReturnType<typeof setTimeout> | undefined;
  let readyTimer: ReturnType<typeof setTimeout> | undefined;

  const clearTimers = () => {
    clearTimeout(pending);
    clearTimeout(readyTimer);
    pending = undefined;
    readyTimer = undefined;
  };

  const replaceNow = () => {
    pending = undefined;
    deps.replace();
    readyTimer = setTimeout(() => {
      readyTimer = undefined;
      if (!deps.isReady()) onRendererLost();
    }, REPLACEMENT_READY_TIMEOUT_MS);
  };

  const onRendererLost = () => {
    if (waitingForForeground || pending !== undefined) return;
    clearTimeout(readyTimer);
    readyTimer = undefined;
    if (replacements >= MAX_UNREADY_REPLACEMENTS) {
      waitingForForeground = true;
      return;
    }
    const delay = getReplacementDelay(replacements);
    replacements += 1;
    if (delay === 0) replaceNow();
    else pending = setTimeout(replaceNow, delay);
  };

  const unsubscribe = deps.subscribeReady((ready) => {
    if (!ready) return;
    clearTimers();
    replacements = 0;
    waitingForForeground = false;
  });

  return {
    onRendererLost,
    onForeground() {
      if (!waitingForForeground) return;
      waitingForForeground = false;
      replacements = 0;
      onRendererLost();
    },
    isWaitingForForeground: () => waitingForForeground,
    dispose() {
      clearTimers();
      unsubscribe();
    },
  };
}

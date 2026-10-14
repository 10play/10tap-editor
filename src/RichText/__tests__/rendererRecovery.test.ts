import {
  MAX_REPLACEMENT_BACKOFF_MS,
  MAX_UNREADY_REPLACEMENTS,
  REPLACEMENT_BACKOFF_MS,
  REPLACEMENT_READY_TIMEOUT_MS,
  createRendererRecovery,
  getReplacementDelay,
} from '../rendererRecovery';

const setup = () => {
  let ready = false;
  const listeners = new Set<(value: boolean) => void>();
  const replace = jest.fn(() => {
    ready = false;
  });
  const recovery = createRendererRecovery({
    replace,
    isReady: () => ready,
    subscribeReady: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  });
  const becomeReady = () => {
    ready = true;
    listeners.forEach((listener) => listener(true));
  };
  return { recovery, replace, becomeReady, listeners };
};

/** Total wait for `count` replacements in a row that never get ready. */
const timeForFailures = (count: number) => {
  let total = 0;
  for (let failures = 0; failures < count; failures += 1) {
    total += getReplacementDelay(failures) + REPLACEMENT_READY_TIMEOUT_MS;
  }
  return total;
};

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('renderer recovery', () => {
  it('doubles the wait between replacements up to a ceiling', () => {
    expect(getReplacementDelay(0)).toBe(0);
    expect(getReplacementDelay(1)).toBe(REPLACEMENT_BACKOFF_MS);
    expect(getReplacementDelay(2)).toBe(REPLACEMENT_BACKOFF_MS * 2);
    expect(getReplacementDelay(20)).toBe(MAX_REPLACEMENT_BACKOFF_MS);
  });

  it('replaces the first lost renderer at once', () => {
    const t = setup();
    t.recovery.onRendererLost();
    expect(t.replace).toHaveBeenCalledTimes(1);
  });

  it('replaces a replacement that is not ready in time after a backoff', () => {
    const t = setup();
    t.recovery.onRendererLost();
    jest.advanceTimersByTime(REPLACEMENT_READY_TIMEOUT_MS);
    expect(t.replace).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(REPLACEMENT_BACKOFF_MS - 1);
    expect(t.replace).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1);
    expect(t.replace).toHaveBeenCalledTimes(2);
  });

  it('waits out the backoff when the replacement crashes too', () => {
    const t = setup();
    t.recovery.onRendererLost();
    // The new renderer dies at launch, and reports it more than once.
    t.recovery.onRendererLost();
    t.recovery.onRendererLost();
    expect(t.replace).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(REPLACEMENT_BACKOFF_MS);
    expect(t.replace).toHaveBeenCalledTimes(2);
  });

  it('stops after a bounded number of replacements in a row', () => {
    const t = setup();
    t.recovery.onRendererLost();
    jest.advanceTimersByTime(timeForFailures(MAX_UNREADY_REPLACEMENTS) * 10);
    expect(t.replace).toHaveBeenCalledTimes(MAX_UNREADY_REPLACEMENTS);
    expect(t.recovery.isWaitingForForeground()).toBe(true);

    // Crash reports while waiting do nothing either.
    t.recovery.onRendererLost();
    jest.advanceTimersByTime(timeForFailures(MAX_UNREADY_REPLACEMENTS));
    expect(t.replace).toHaveBeenCalledTimes(MAX_UNREADY_REPLACEMENTS);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('tries again with a fresh budget when the app returns to the foreground', () => {
    const t = setup();
    t.recovery.onRendererLost();
    jest.advanceTimersByTime(timeForFailures(MAX_UNREADY_REPLACEMENTS) * 10);
    expect(t.replace).toHaveBeenCalledTimes(MAX_UNREADY_REPLACEMENTS);

    t.recovery.onForeground();
    expect(t.replace).toHaveBeenCalledTimes(MAX_UNREADY_REPLACEMENTS + 1);
    expect(t.recovery.isWaitingForForeground()).toBe(false);
    t.becomeReady();
    jest.advanceTimersByTime(timeForFailures(MAX_UNREADY_REPLACEMENTS) * 10);
    expect(t.replace).toHaveBeenCalledTimes(MAX_UNREADY_REPLACEMENTS + 1);
  });

  it('ignores the foreground while it has not given up', () => {
    const t = setup();
    t.recovery.onForeground();
    expect(t.replace).not.toHaveBeenCalled();
    t.recovery.onRendererLost();
    t.recovery.onForeground();
    expect(t.replace).toHaveBeenCalledTimes(1);
  });

  it('starts over once a replacement becomes ready', () => {
    const t = setup();
    t.recovery.onRendererLost();
    jest.advanceTimersByTime(
      REPLACEMENT_READY_TIMEOUT_MS + REPLACEMENT_BACKOFF_MS
    );
    expect(t.replace).toHaveBeenCalledTimes(2);
    t.becomeReady();
    jest.advanceTimersByTime(REPLACEMENT_READY_TIMEOUT_MS * 10);
    expect(t.replace).toHaveBeenCalledTimes(2);

    // A later crash is replaced at once again.
    t.recovery.onRendererLost();
    expect(t.replace).toHaveBeenCalledTimes(3);
  });

  it('dispose clears its timers and the ready subscription', () => {
    const t = setup();
    t.recovery.onRendererLost();
    t.recovery.dispose();
    expect(jest.getTimerCount()).toBe(0);
    expect(t.listeners.size).toBe(0);
  });
});

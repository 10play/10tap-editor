/**
 * #339: on React Native `window` exists but `window.document` does not, and
 * Metro without inline requires evaluates every import eagerly. Importing
 * the package (which reaches the web focus tracker through CoreBridge) must
 * not touch the DOM.
 */

describe('import safety without a DOM (#339)', () => {
  const host = globalThis as unknown as { document?: unknown };
  let savedDocument: unknown;

  beforeEach(() => {
    savedDocument = host.document;
    delete host.document;
    jest.resetModules();
  });

  afterEach(() => {
    if (savedDocument !== undefined) host.document = savedDocument;
  });

  it('runs in an environment shaped like React Native', () => {
    expect(typeof window).toBe('object');
    expect(host.document).toBeUndefined();
  });

  it('imports the package entry point', () => {
    expect(() => jest.requireActual('../../index')).not.toThrow();
  });

  it('reports no focus instead of throwing', () => {
    const { focusListener, getFocusTracker } = jest.requireActual<
      typeof import('../../webEditorUtils/focusListener')
    >('../../webEditorUtils/focusListener');

    expect(focusListener.isFocused).toBe(false);
    expect(getFocusTracker().isFocused).toBe(false);
  });
});

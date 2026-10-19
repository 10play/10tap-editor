// The bridges are part of the native entry point, where there is no DOM (#339).
jest.mock('../../webEditorUtils/focusListener', () => {
  throw new Error('a DOM module was imported by native code');
});

describe('bridge imports on native', () => {
  it('load without a DOM', () => {
    expect('document' in globalThis).toBe(false);
    expect(() => require('../StarterKit')).not.toThrow();
    expect(() => require('../HighlightSelection')).not.toThrow();
  });
});

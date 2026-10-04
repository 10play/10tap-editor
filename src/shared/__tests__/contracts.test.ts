import {
  EDITOR_CONTROLLER,
  attachEditorController,
  getEditorController,
  type EditorController,
} from '../contracts';
import { TentapRpcTimeoutError, TentapUnsupportedError } from '../errors';

const fakeController = { editorId: 'tt1' } as EditorController;

describe('editor controller accessor', () => {
  it('exposes the controller without making it enumerable', () => {
    const editor = { focus: () => undefined };
    attachEditorController(editor, fakeController);
    expect(getEditorController(editor)).toBe(fakeController);
    expect(Object.keys(editor)).toEqual(['focus']);
    expect({ ...editor }).not.toHaveProperty([EDITOR_CONTROLLER]);
  });

  it('uses a registry symbol so duplicated bundles agree', () => {
    expect(EDITOR_CONTROLLER).toBe(
      Symbol.for('@10play/tentap-editor/controller')
    );
  });

  it('can re-attach a controller', () => {
    const editor = {};
    attachEditorController(editor, fakeController);
    const next = { editorId: 'tt2' } as EditorController;
    attachEditorController(editor, next);
    expect(getEditorController(editor)).toBe(next);
  });

  it('returns undefined for editors without a controller', () => {
    expect(getEditorController({})).toBeUndefined();
    expect(getEditorController(undefined)).toBeUndefined();
    expect(getEditorController(null)).toBeUndefined();
  });
});

describe('errors', () => {
  it('are real Error subclasses usable with instanceof', () => {
    const timeout = new TentapRpcTimeoutError('get-html', 10000);
    expect(timeout).toBeInstanceOf(TentapRpcTimeoutError);
    expect(timeout).toBeInstanceOf(Error);
    expect(timeout.name).toBe('TentapRpcTimeoutError');
    expect(timeout.requestType).toBe('get-html');
    expect(timeout.timeoutMs).toBe(10000);
    expect(timeout.message).toContain('get-html');

    const unsupported = new TentapUnsupportedError('selectedText');
    expect(unsupported).toBeInstanceOf(TentapUnsupportedError);
    expect(unsupported).not.toBeInstanceOf(TentapRpcTimeoutError);
    expect(unsupported.capability).toBe('selectedText');
    expect(unsupported.message).toContain('Rebuild');
  });
});

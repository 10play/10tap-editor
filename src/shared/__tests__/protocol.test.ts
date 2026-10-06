import {
  CAPABILITIES,
  LEGACY_CAPABILITIES,
  WEB_RUNTIME_CAPABILITIES,
  hasCapability,
} from '../capabilities';
import {
  ACTION_ENVELOPE_TYPE,
  PROTOCOL_VERSION,
  capabilitiesFromEditorReady,
  createActionEnvelope,
  createDedupe,
  createEditorId,
  createEditorReadyPayload,
  createSequence,
  createWebMessage,
  decodeActionEnvelope,
  decodeWebMessage,
  encodeMessage,
  isForEditor,
  parseEditorReadyPayload,
  readRpcReply,
  withMessageId,
} from '../protocol';

describe('ids', () => {
  it('creates distinct editor ids that are safe in selectors and JSON', () => {
    const ids = new Set(Array.from({ length: 200 }, createEditorId));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).toMatch(/^tt[0-9a-z]+$/);
  });

  it('numbers messages per editor, starting at 1', () => {
    const a = createSequence('a');
    const b = createSequence('b');
    expect([a.next(), a.next(), b.next()]).toEqual(['a.1', 'a.2', 'b.1']);
  });
});

describe('native → web envelopes', () => {
  it('round-trips a protocol 2 envelope', () => {
    const envelope = createActionEnvelope(
      { type: 'set-content', payload: { content: '<p>Hi</p>' } },
      { id: 'tt1.1', editorId: 'tt1' }
    );
    expect(decodeActionEnvelope(encodeMessage(envelope))).toEqual(envelope);
  });

  it('accepts the 1.0 envelope without id and editorId', () => {
    expect(
      decodeActionEnvelope('{"type":"action","payload":{"type":"toggle-bold"}}')
    ).toEqual({ type: ACTION_ENVELOPE_TYPE, payload: { type: 'toggle-bold' } });
  });

  it('omits unset optional fields', () => {
    expect(Object.keys(createActionEnvelope({ type: 'blur' }))).toEqual([
      'type',
      'payload',
    ]);
  });

  it.each([
    ['a non-string', { type: 'action', payload: { type: 'blur' } }],
    ['invalid JSON', '{"type":'],
    ['JSON null', 'null'],
    ['an array', '[]'],
    ['another envelope type', '{"type":"other","payload":{"type":"blur"}}'],
    ['a payload without type', '{"type":"action","payload":{}}'],
    ['a non-object payload', '{"type":"action","payload":"blur"}'],
  ])('rejects %s', (_name, data) => {
    expect(decodeActionEnvelope(data)).toBeNull();
  });

  it('drops malformed optional fields instead of trusting them', () => {
    expect(
      decodeActionEnvelope(
        '{"type":"action","payload":{"type":"blur"},"id":7,"editorId":{}}'
      )
    ).toEqual({ type: 'action', payload: { type: 'blur' } });
  });
});

describe('web → native messages', () => {
  it('tags messages with the editor id and protocol version', () => {
    expect(createWebMessage('document-height', 10, 'tt1')).toEqual({
      type: 'document-height',
      payload: 10,
      editorId: 'tt1',
      v: PROTOCOL_VERSION,
    });
    expect(createWebMessage('content-update', undefined)).toEqual({
      type: 'content-update',
      payload: undefined,
    });
  });

  it('decodes legacy and protocol 2 messages', () => {
    expect(decodeWebMessage('{"type":"content-update"}')).toEqual({
      type: 'content-update',
      payload: undefined,
    });
    expect(
      decodeWebMessage(
        '{"type":"stateUpdate","payload":{"isReady":true},"editorId":"tt1","v":2}'
      )
    ).toEqual({
      type: 'stateUpdate',
      payload: { isReady: true },
      editorId: 'tt1',
      v: 2,
    });
  });

  it.each([
    ['a non-string', { type: 'stateUpdate' }],
    ['invalid JSON', 'not json'],
    ['a value without type', '{"payload":1}'],
    ['a numeric type', '{"type":1}'],
    ['a primitive', '"stateUpdate"'],
  ])('ignores %s', (_name, data) => {
    expect(decodeWebMessage(data)).toBeNull();
  });

  it('filters by editor id but always accepts untagged legacy messages', () => {
    expect(isForEditor(undefined, 'tt1')).toBe(true);
    expect(isForEditor('tt1', 'tt1')).toBe(true);
    expect(isForEditor('tt2', 'tt1')).toBe(false);
  });
});

describe('handshake', () => {
  it('round-trips the editor-ready payload into capabilities', () => {
    const payload = createEditorReadyPayload('tt1', WEB_RUNTIME_CAPABILITIES);
    expect(payload).toEqual({
      protocol: PROTOCOL_VERSION,
      capabilities: [...WEB_RUNTIME_CAPABILITIES],
      editorId: 'tt1',
    });
    const capabilities = capabilitiesFromEditorReady(payload);
    expect(capabilities.legacy).toBe(false);
    expect(capabilities.protocol).toBe(2);
    for (const name of Object.values(CAPABILITIES)) {
      expect(hasCapability(capabilities, name)).toBe(true);
    }
  });

  it.each([
    ['no payload', undefined],
    ['null', null],
    ['protocol 1', { protocol: 1, capabilities: [], editorId: 'x' }],
    ['a missing editor id', { protocol: 2, capabilities: [] }],
    [
      'non-array capabilities',
      { protocol: 2, capabilities: 'all', editorId: 'x' },
    ],
  ])('treats %s as a legacy bundle', (_name, payload) => {
    expect(parseEditorReadyPayload(payload)).toBeNull();
    expect(capabilitiesFromEditorReady(payload)).toBe(LEGACY_CAPABILITIES);
    expect(hasCapability(LEGACY_CAPABILITIES, CAPABILITIES.SelectedText)).toBe(
      false
    );
  });

  it('keeps unknown capabilities from newer bundles and drops non-strings', () => {
    const capabilities = capabilitiesFromEditorReady({
      protocol: 3,
      capabilities: ['styles', 'futureThing', 4, 'styles'],
      editorId: 'x',
    });
    expect(capabilities.names).toEqual(['styles', 'futureThing']);
    expect(capabilities.protocol).toBe(3);
  });
});

describe('rpc helpers', () => {
  it('sets payload.messageId without mutating the request', () => {
    const request = {
      type: 'get-selected-text',
      payload: { range: { from: 1, to: 2 } },
    };
    const sent = withMessageId(request, 'tt1.3');
    expect(sent).toEqual({
      type: 'get-selected-text',
      payload: { range: { from: 1, to: 2 }, messageId: 'tt1.3' },
    });
    expect(request.payload).toEqual({ range: { from: 1, to: 2 } });
  });

  it('replaces a missing or primitive payload', () => {
    expect(withMessageId({ type: 'get-html' }, 'a.1').payload).toEqual({
      messageId: 'a.1',
    });
    expect(withMessageId({ type: 'x', payload: 5 }, 'a.2').payload).toEqual({
      messageId: 'a.2',
    });
  });

  it('reads replies by message id', () => {
    expect(
      readRpcReply({
        type: 'send-html-back',
        payload: { content: '<p/>', messageId: 'a.1' },
      })
    ).toEqual({ messageId: 'a.1', content: '<p/>' });
    expect(readRpcReply({ type: 'x', payload: { messageId: 'a.2' } })).toEqual({
      messageId: 'a.2',
      content: undefined,
    });
    expect(readRpcReply({ type: 'stateUpdate', payload: {} })).toBeNull();
    expect(readRpcReply({ type: 'document-height', payload: 3 })).toBeNull();
  });
});

describe('createDedupe', () => {
  it('reports repeats and forgets the least recently seen id', () => {
    const dedupe = createDedupe(2);
    expect(dedupe.seen('a')).toBe(false);
    expect(dedupe.seen('a')).toBe(true);
    expect(dedupe.seen('b')).toBe(false);
    expect(dedupe.seen('a')).toBe(true); // refreshes a
    expect(dedupe.seen('c')).toBe(false); // evicts b
    expect(dedupe.seen('a')).toBe(true);
    expect(dedupe.seen('b')).toBe(false);
  });

  it('remembers 64 ids by default', () => {
    const dedupe = createDedupe();
    for (let i = 0; i < 64; i++) dedupe.seen(`id${i}`);
    expect(dedupe.seen('id0')).toBe(true);
    dedupe.seen('id64');
    expect(dedupe.seen('id1')).toBe(false);
  });
});

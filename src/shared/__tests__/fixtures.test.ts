import {
  FIXTURE_EDITOR_ID,
  FIXTURE_MESSAGE_ID,
  wireFixtures,
  type WireFixture,
} from '../../__fixtures__/wire';
import { CAPABILITIES, WEB_RUNTIME_CAPABILITIES } from '../capabilities';
import {
  PROTOCOL_TYPES,
  createEditorReadyPayload,
  decodeActionEnvelope,
  decodeWebMessage,
  encodeMessage,
  parseEditorReadyPayload,
  readRpcReply,
} from '../protocol';

const byKind = (kind: WireFixture['kind']) =>
  wireFixtures.filter((fixture) => fixture.kind === kind);
const types = new Set(wireFixtures.map((fixture) => fixture.message.type));

describe('wire fixtures', () => {
  it('have unique ids', () => {
    const ids = wireFixtures.map((fixture) => fixture.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each([
    'container-height',
    'tentap-editor-press',
    'boot-error',
    'insert-content',
    'get-selected-text',
    'send-selected-text-back',
  ])('cover %s', (type) => {
    expect(types).toContain(type);
  });

  it('cover every protocol type, with matching values', () => {
    const protocolFixtures = wireFixtures.filter((f) => f.protocolType);
    for (const fixture of protocolFixtures) {
      const key = fixture.protocolType as keyof typeof PROTOCOL_TYPES;
      expect(PROTOCOL_TYPES[key]).toBe(fixture.message.type);
    }
    expect(
      new Set(protocolFixtures.map((fixture) => fixture.protocolType))
    ).toEqual(new Set(Object.keys(PROTOCOL_TYPES)));
  });

  it('only use known capabilities', () => {
    const known: readonly string[] = Object.values(CAPABILITIES);
    const used = wireFixtures.flatMap((fixture) => fixture.capability ?? []);
    expect(used.length).toBeGreaterThan(0);
    for (const capability of used) expect(known).toContain(capability);
  });

  it('give every message a direction and every enum fixture a member', () => {
    for (const fixture of wireFixtures) {
      expect(fixture.kind === 'constant' || !!fixture.direction).toBe(true);
      expect(Boolean(fixture.enum)).toBe(Boolean(fixture.member));
      expect(Boolean(fixture.enum) || Boolean(fixture.protocolType)).toBe(true);
    }
  });

  it('describe a native call for every enum command sent by native', () => {
    const commands = byKind('message').filter(
      (fixture) => fixture.direction === 'native-to-web' && fixture.enum
    );
    for (const fixture of commands) expect(fixture.call).toBeDefined();
  });

  it('carry the transport message id on RPC requests', () => {
    const requests = wireFixtures.filter((fixture) => fixture.rpc);
    expect(requests.length).toBeGreaterThan(0);
    for (const fixture of requests) {
      expect(fixture.direction).toBe('native-to-web');
      expect(readRpcReply(fixture.message)?.messageId).toBe(FIXTURE_MESSAGE_ID);
    }
  });

  it('pair every RPC reply with the fixture message id', () => {
    const replies = byKind('message').filter((fixture) =>
      fixture.message.type.startsWith('send-')
    );
    expect(replies.length).toBe(4);
    for (const fixture of replies) {
      expect(fixture.direction).toBe('web-to-native');
      expect(readRpcReply(fixture.message)?.messageId).toBe(FIXTURE_MESSAGE_ID);
    }
  });

  it('decode as native would receive them', () => {
    for (const fixture of byKind('message')) {
      if (fixture.direction !== 'web-to-native') continue;
      expect(decodeWebMessage(encodeMessage(fixture.message))).toEqual(
        fixture.message
      );
    }
  });

  it('decode as the web runtime would receive them', () => {
    for (const fixture of byKind('envelope')) {
      expect(decodeActionEnvelope(encodeMessage(fixture.message))).toEqual(
        fixture.message
      );
    }
  });

  it('lock the editor-ready handshake to the runtime capabilities', () => {
    const ready = wireFixtures.find((f) => f.id === 'protocol.editor-ready');
    expect(ready?.message.payload).toEqual(
      createEditorReadyPayload(FIXTURE_EDITOR_ID, WEB_RUNTIME_CAPABILITIES)
    );
    expect(parseEditorReadyPayload(ready?.message.payload)).not.toBeNull();
    const legacy = wireFixtures.find(
      (f) => f.id === 'core.editor-ready.legacy'
    );
    expect(parseEditorReadyPayload(legacy?.message.payload)).toBeNull();
  });
});

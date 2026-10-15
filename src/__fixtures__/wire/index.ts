import bridges from './bridges.json';
import core from './core.json';
import legacy from './legacy.json';
import protocol from './protocol.json';

/**
 * Golden wire fixtures shared by the jest (native) and vitest (web) suites.
 * They lock every wire string and payload shape: native tests assert that a
 * `call` produces exactly `message`; web tests assert that `message` is
 * handled.
 */

export const FIXTURE_EDITOR_ID = 'tt-fixture';
/** The transport-assigned `payload.messageId` used by RPC fixtures. */
export const FIXTURE_MESSAGE_ID = `${FIXTURE_EDITOR_ID}.1`;

export type WireDirection = 'native-to-web' | 'web-to-native';

export interface WireMessage {
  type: string;
  payload?: unknown;
  [field: string]: unknown;
}

export interface WireFixture {
  id: string;
  /** `message` is a bridge message (default), a full envelope, or an enum value lock. */
  kind: 'message' | 'envelope' | 'constant';
  direction?: WireDirection;
  /** Exported enum whose `member` holds `message.type`. */
  enum?: string;
  member?: string;
  /** Key of `PROTOCOL_TYPES` whose value is `message.type`. */
  protocolType?: string;
  /** Capability the web bundle must advertise to handle the message. */
  capability?: string;
  /** Sent through the RPC registry: `payload.messageId` is `FIXTURE_MESSAGE_ID`. */
  rpc?: boolean;
  /** `EditorBridge` call that produces `message`. */
  call?: { method: string; args: unknown[] };
  message: WireMessage;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const KINDS: readonly WireFixture['kind'][] = [
  'message',
  'envelope',
  'constant',
];
const DIRECTIONS: readonly WireDirection[] = ['native-to-web', 'web-to-native'];

const includes = <T extends string>(
  options: readonly T[],
  value: unknown
): value is T => options.some((option) => option === value);

function parseFixture(value: unknown): WireFixture {
  if (!isRecord(value) || typeof value.id !== 'string') {
    throw new Error(`Wire fixture without an id: ${JSON.stringify(value)}`);
  }
  const { id } = value;
  const fail = (problem: string): never => {
    throw new Error(`Wire fixture ${id}: ${problem}`);
  };
  const optionalString = (field: string): string | undefined => {
    const fieldValue = value[field];
    if (fieldValue === undefined || typeof fieldValue === 'string') {
      return fieldValue;
    }
    return fail(`"${field}" must be a string`);
  };

  const { message, call, kind = 'message', direction, rpc } = value;
  if (!isRecord(message) || typeof message.type !== 'string') {
    return fail('"message.type" must be a string');
  }
  if (!includes(KINDS, kind)) return fail(`unknown kind ${String(kind)}`);
  if (direction !== undefined && !includes(DIRECTIONS, direction)) {
    return fail(`unknown direction ${String(direction)}`);
  }
  if (rpc !== undefined && typeof rpc !== 'boolean') {
    return fail('"rpc" must be a boolean');
  }
  let parsedCall: WireFixture['call'];
  if (call !== undefined) {
    if (
      !isRecord(call) ||
      typeof call.method !== 'string' ||
      !Array.isArray(call.args)
    ) {
      return fail('"call" needs a method and args');
    }
    parsedCall = { method: call.method, args: call.args };
  }

  return {
    id,
    kind,
    direction,
    enum: optionalString('enum'),
    member: optionalString('member'),
    protocolType: optionalString('protocolType'),
    capability: optionalString('capability'),
    rpc,
    call: parsedCall,
    message: { ...message, type: message.type },
  };
}

function parseFile(file: unknown): WireFixture[] {
  if (!isRecord(file) || !Array.isArray(file.fixtures)) {
    throw new Error('Wire fixture file must have a "fixtures" array');
  }
  return file.fixtures.map(parseFixture);
}

export const wireFixtures: readonly WireFixture[] = [
  ...parseFile(core),
  ...parseFile(bridges),
  ...parseFile(protocol),
  ...parseFile(legacy),
];

export function getWireFixture(id: string): WireFixture {
  const fixture = wireFixtures.find((candidate) => candidate.id === id);
  if (!fixture) throw new Error(`Unknown wire fixture ${id}`);
  return fixture;
}

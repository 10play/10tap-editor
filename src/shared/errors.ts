import type { CapabilityName } from './capabilities';

/** An RPC (e.g. `getHTML`) got no reply within `rpcTimeoutMs`. */
export class TentapRpcTimeoutError extends Error {
  readonly requestType: string;
  readonly timeoutMs: number;

  constructor(requestType: string, timeoutMs: number) {
    super(`TenTap: "${requestType}" got no reply within ${timeoutMs} ms`);
    this.name = 'TentapRpcTimeoutError';
    this.requestType = requestType;
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** The web bundle in the WebView does not implement a requested feature. */
export class TentapUnsupportedError extends Error {
  readonly capability: CapabilityName;

  constructor(capability: CapabilityName) {
    super(
      `TenTap: the editor web bundle does not support "${capability}". ` +
        'Rebuild your custom editor bundle against this version of @10play/tentap-editor.'
    );
    this.name = 'TentapUnsupportedError';
    this.capability = capability;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

import type { WebViewHandle } from '../../shared/contracts';
import {
  createEditorReadyPayload,
  createWebMessage,
  encodeMessage,
  PROTOCOL_TYPES,
  type ActionEnvelope,
  type BridgeMessage,
} from '../../shared/protocol';
import { WEB_RUNTIME_CAPABILITIES } from '../../shared/capabilities';
import {
  createEditorController,
  type NativeEditorController,
} from '../EditorController';
import type { EditorControllerOptions } from '../../shared/contracts';

/** Records what the controller posts and injects. */
export class FakeWebView implements WebViewHandle {
  readonly envelopes: ActionEnvelope[] = [];
  readonly scripts: string[] = [];
  reloadCount = 0;
  focusCount = 0;

  postMessage(data: string): void {
    this.envelopes.push(JSON.parse(data) as ActionEnvelope);
  }

  injectJavaScript(script: string): void {
    this.scripts.push(script);
  }

  requestFocus(): void {
    this.focusCount += 1;
  }

  reload(): void {
    this.reloadCount += 1;
  }

  /** Inner bridge messages, in posting order. */
  get messages(): BridgeMessage[] {
    return this.envelopes.map((envelope) => envelope.payload);
  }

  get types(): string[] {
    return this.messages.map((message) => message.type);
  }
}

export interface TestState {
  isReady: boolean;
  isFocused: boolean;
  editable: boolean;
}

export const initialState: TestState = {
  isReady: false,
  isFocused: false,
  editable: true,
};

export const EDITOR_ID = 'tt-test';

export function setup(
  options: Partial<EditorControllerOptions<TestState>> = {}
): { controller: NativeEditorController<TestState>; webView: FakeWebView } {
  const controller = createEditorController<TestState>({
    platform: 'ios',
    initialState,
    editorId: EDITOR_ID,
    ...options,
  });
  const webView = new FakeWebView();
  controller.attach();
  controller.setWebView(webView);
  controller.onLoadStart();
  return { controller, webView };
}

/** The v2 handshake, as the 1.1 web runtime posts it. */
export const handshake = (
  editorId: string = EDITOR_ID,
  capabilities: readonly string[] = WEB_RUNTIME_CAPABILITIES
): string =>
  encodeMessage(
    createWebMessage(
      PROTOCOL_TYPES.EditorReady,
      createEditorReadyPayload(editorId, capabilities),
      editorId
    )
  );

/** What a 1.0.x / 0.7.x bundle posts from `onCreate`. */
export const legacyReady = (): string =>
  encodeMessage({ type: PROTOCOL_TYPES.EditorReady });

export const webMessage = (
  type: string,
  payload?: unknown,
  editorId?: string
): string => encodeMessage(createWebMessage(type, payload, editorId));

import { asyncMessages } from '../../RichText/AsyncMessages';
import type { BridgeMessage } from '../../shared/protocol';
import { handshake, setup, webMessage } from './helpers';

type GetHTML = { type: 'get-html'; payload?: { messageId: string } };

const pendingIds = () => Object.keys(asyncMessages.subscriptions);

afterEach(() => {
  pendingIds().forEach((id) => asyncMessages.onMessage(id, undefined));
});

describe('asyncMessages (deprecated shim)', () => {
  it('posts through the given sender and resolves through onMessage', async () => {
    const sent: GetHTML[] = [];
    const send = (message: GetHTML) => sent.push(message);
    const request: GetHTML = { type: 'get-html' };

    const html = asyncMessages.sendAsyncMessage<string>(request, send);
    const messageId = sent[0]!.payload!.messageId;
    asyncMessages.onMessage(messageId, '<p>hi</p>');

    await expect(html).resolves.toBe('<p>hi</p>');
    expect(request).toEqual({ type: 'get-html' });
  });

  it('resolves requests from the core reply of an editor', async () => {
    const { controller } = setup();
    controller.handleWebViewMessage(handshake());
    const html = asyncMessages.sendAsyncMessage<string>(
      { type: 'get-html' },
      (message) => controller.send(message)
    );
    const [messageId] = pendingIds();

    controller.handleWebViewMessage(
      webMessage('send-html-back', { messageId, content: '<p>hi</p>' })
    );

    await expect(html).resolves.toBe('<p>hi</p>');
  });

  it('removes callbacks once called (#346)', async () => {
    const sent: BridgeMessage[] = [];
    const requests = Array.from({ length: 5 }, () =>
      asyncMessages.sendAsyncMessage<number>({ type: 'get-text' }, (message) =>
        sent.push(message)
      )
    );
    expect(pendingIds()).toHaveLength(5);

    sent.forEach((message, index) => {
      const { messageId } = message.payload as { messageId: string };
      asyncMessages.onMessage(messageId, index);
      asyncMessages.onMessage(messageId, -1);
    });

    await expect(Promise.all(requests)).resolves.toEqual([0, 1, 2, 3, 4]);
    expect(pendingIds()).toEqual([]);
  });

  it('keeps addListener working for custom bridges', () => {
    const callback = jest.fn();
    asyncMessages.addListener('custom', callback);
    asyncMessages.onMessage('custom', 1);
    asyncMessages.onMessage('custom', 2);
    expect(callback.mock.calls).toEqual([[1]]);
  });

  it('drops requests when the editor attached at request time detaches', () => {
    const { controller } = setup();
    void asyncMessages.sendAsyncMessage({ type: 'get-html' }, () => {});
    expect(pendingIds()).toHaveLength(1);

    controller.detach();

    expect(pendingIds()).toEqual([]);
  });
});

import { Outbox, Transport, type OutboxEntry } from '../transport';
import { FakeWebView } from './helpers';

type MessageEntry = Extract<OutboxEntry, { kind: 'message' }>;

const message = (type: string, payload?: unknown): MessageEntry => ({
  kind: 'message',
  message: { type, payload },
});

describe('Outbox', () => {
  it('moves a coalesced entry to the end', () => {
    const outbox = new Outbox();
    outbox.push({ ...message('set-editable', false), coalesceKey: 'editable' });
    outbox.push(message('set-content', { content: 'x' }));
    outbox.push({ kind: 'rpc', messageId: 'id.1' });
    outbox.push({ ...message('set-editable', true), coalesceKey: 'editable' });

    expect(outbox.drain()).toEqual([
      message('set-content', { content: 'x' }),
      { kind: 'rpc', messageId: 'id.1' },
      { ...message('set-editable', true), coalesceKey: 'editable' },
    ]);
    expect(outbox.size).toBe(0);
  });

  it('drops the oldest fire-and-forget entry when over the limit', () => {
    const dropped: OutboxEntry[] = [];
    const outbox = new Outbox(3, (entry) => dropped.push(entry));
    outbox.push(message('set-content', { content: 'x' }));
    outbox.push({ kind: 'rpc', messageId: 'id.1' });
    outbox.push({ kind: 'script', js: 'a();' });
    outbox.push(message('toggle-bold'));
    outbox.push(message('toggle-italic'));

    expect(dropped).toEqual([
      { kind: 'script', js: 'a();' },
      message('toggle-bold'),
    ]);
    expect(outbox.drain()).toEqual([
      message('set-content', { content: 'x' }),
      { kind: 'rpc', messageId: 'id.1' },
      message('toggle-italic'),
    ]);
  });

  it('exceeds the limit rather than drop content or RPCs', () => {
    const outbox = new Outbox(1);
    outbox.push(message('insert-content', { content: 'a' }));
    outbox.push({ kind: 'rpc', messageId: 'id.1' });

    expect(outbox.size).toBe(2);
  });
});

describe('Transport', () => {
  it('posts envelopes with sequential ids shared with nextId', () => {
    const transport = new Transport('tt-a');
    const webView = new FakeWebView();
    transport.setWebView(webView);

    transport.post({ type: 'blur' });
    expect(transport.nextId()).toBe('tt-a.2');
    transport.post({ type: 'focus', payload: 'end' });
    transport.inject('x();');

    expect(webView.envelopes).toEqual([
      {
        type: 'action',
        payload: { type: 'blur' },
        id: 'tt-a.1',
        editorId: 'tt-a',
      },
      {
        type: 'action',
        payload: { type: 'focus', payload: 'end' },
        id: 'tt-a.3',
        editorId: 'tt-a',
      },
    ]);
    expect(webView.scripts).toEqual(['x();']);
  });

  it('reports whether the WebView changed', () => {
    const transport = new Transport('tt-a');
    const webView = new FakeWebView();
    expect(transport.setWebView(webView)).toBe(true);
    expect(transport.setWebView(webView)).toBe(false);
    expect(transport.setWebView(null)).toBe(true);
    expect(() => transport.post({ type: 'blur' })).not.toThrow();
  });
});

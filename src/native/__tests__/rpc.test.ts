import { TentapRpcTimeoutError } from '../../shared/errors';
import { RpcRegistry } from '../rpc';

afterEach(() => {
  jest.useRealTimers();
});

describe('RpcRegistry', () => {
  it('sets the message id on a copy of the request', () => {
    const registry = new RpcRegistry();
    const message = { type: 'get-html', payload: { keep: true } };

    void registry.create('id.1', message);

    expect(registry.get('id.1')?.request).toEqual({
      type: 'get-html',
      payload: { keep: true, messageId: 'id.1' },
    });
    expect(message).toEqual({ type: 'get-html', payload: { keep: true } });
  });

  it('deletes entries as they settle', async () => {
    const registry = new RpcRegistry();
    const first = registry.create<string>('id.1', { type: 'get-html' });
    const second = registry.create<string>('id.2', { type: 'get-text' });
    expect(registry.ids()).toEqual(['id.1', 'id.2']);

    expect(registry.resolve('id.1', '<p/>')).toBe(true);
    expect(registry.resolve('id.1', 'late')).toBe(false);
    expect(registry.reject('id.2', new Error('nope'))).toBe(true);

    await expect(first).resolves.toBe('<p/>');
    await expect(second).rejects.toThrow('nope');
    expect(registry.size).toBe(0);
  });

  it('times out with TentapRpcTimeoutError', async () => {
    jest.useFakeTimers();
    const registry = new RpcRegistry();
    const html = registry.create(
      'id.1',
      { type: 'get-html' },
      { timeoutMs: 50 }
    );

    jest.advanceTimersByTime(50);

    const error = await html.catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(TentapRpcTimeoutError);
    expect(error).toMatchObject({ requestType: 'get-html', timeoutMs: 50 });
    expect(registry.size).toBe(0);
  });

  it('restarts timers in full after a pause', async () => {
    jest.useFakeTimers();
    const registry = new RpcRegistry();
    const html = registry.create(
      'id.1',
      { type: 'get-html' },
      { timeoutMs: 50 }
    );
    jest.advanceTimersByTime(40);

    registry.pauseTimers();
    const text = registry.create(
      'id.2',
      { type: 'get-text' },
      { timeoutMs: 50 }
    );
    jest.advanceTimersByTime(1000);
    expect(registry.size).toBe(2);

    registry.resumeTimers();
    jest.advanceTimersByTime(49);
    expect(registry.size).toBe(2);
    jest.advanceTimersByTime(1);
    expect(registry.size).toBe(0);
    await expect(html).rejects.toBeInstanceOf(TentapRpcTimeoutError);
    await expect(text).rejects.toBeInstanceOf(TentapRpcTimeoutError);
  });

  it('drops pending entries on clear without settling them', async () => {
    jest.useFakeTimers();
    const registry = new RpcRegistry();
    const settled = jest.fn();
    registry
      .create('id.1', { type: 'get-html' }, { timeoutMs: 10 })
      .then(settled, settled);

    registry.clear();
    jest.advanceTimersByTime(100);
    await Promise.resolve();

    expect(registry.size).toBe(0);
    expect(settled).not.toHaveBeenCalled();
  });
});

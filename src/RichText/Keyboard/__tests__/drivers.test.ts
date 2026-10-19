import { createEditorChannel } from '../editorChannel';
import { createNativeDriver, type NativeKeyboardModule } from '../drivers';
import { createFakeEditor, createFakeNativeModule } from './fakes';

const createDrivers = () => {
  const native = createFakeNativeModule();
  const driverFor = () =>
    createNativeDriver(native as NativeKeyboardModule, {
      platform: 'ios',
      channel: createEditorChannel(createFakeEditor().editor),
      getHiddenInput: () => null,
    });
  return { native, first: driverFor(), second: driverFor() };
};

describe('native driver on iOS', () => {
  it("does not release another host's suppression", async () => {
    const { native, first, second } = createDrivers();
    await first.suppress();
    await second.suppress();

    await first.release();
    expect(native.setSystemKeyboardSuppressed).not.toHaveBeenCalledWith(false);

    await second.release();
    expect(native.setSystemKeyboardSuppressed).toHaveBeenLastCalledWith(false);
  });

  it('releases a suppression that is still in flight', async () => {
    const { native, first } = createDrivers();
    const suppressing = first.suppress();
    await first.release();
    await suppressing;

    expect(native.setSystemKeyboardSuppressed.mock.calls).toEqual([
      [true],
      [false],
    ]);
  });

  it('releases nothing after a failed suppression', async () => {
    const { native, first } = createDrivers();
    native.setSystemKeyboardSuppressed.mockResolvedValueOnce(false);
    await first.suppress();
    await first.release();

    expect(native.setSystemKeyboardSuppressed.mock.calls).toEqual([[true]]);
  });
});

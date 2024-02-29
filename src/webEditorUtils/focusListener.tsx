import { isExpo } from '../utils/misc';
class FocusListener {
  private focus: boolean;
  constructor() {
    this.focus = false;
    // @ts-ignore
    window.document.addEventListener(
      'focus',
      () => {
        this.focus = true;
      },
      true
    );
    // @ts-ignore
    window.document.addEventListener(
      'blur',
      () => {
        this.focus = false;
      },
      true
    );
  }
  public get isFocused() {
    return this.focus;
  }
}

// For some reason on expo, this file is parsed on native, and then we get an error
// when bundling because "document" does not exist. This is a hack to "shim" focusListener on expo
const shimmedFocusListener = { isFocused: false };
export const focusListener = isExpo()
  ? shimmedFocusListener
  : new FocusListener();

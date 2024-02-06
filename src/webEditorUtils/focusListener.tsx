class FocusListener {
  private focus: boolean;
  constructor() {
    this.focus = false;
    window.document.addEventListener(
      'focus',
      () => {
        this.focus = true;
      },
      true
    );
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

export const focusListener = new FocusListener();

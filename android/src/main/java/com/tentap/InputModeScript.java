package com.tentap;

/**
 * Toggles {@code inputmode="none"} on the editor's contenteditable. Chromium
 * hides the IME while the focused node has that mode but keeps focus, the
 * InputConnection and the caret.
 *
 * <p>Uses {@code window.__tentap.setInputMode} when the 1.1 web runtime is
 * present and falls back to plain DOM code for legacy bundles. These strings
 * must stay identical to their TypeScript twins in
 * {@code src/RichText/Keyboard/webSnippets.ts}.
 */
final class InputModeScript {
  static final String SUPPRESS =
      "(function(){var t=window.__tentap;if(t&&t.setInputMode){t.setInputMode('none');return}"
          + "var e=document.querySelector('.ProseMirror');if(e){e.setAttribute('inputmode','none')}})();true;";

  static final String RESTORE =
      "(function(){var t=window.__tentap;if(t&&t.setInputMode){t.setInputMode(null);return}"
          + "var e=document.querySelector('.ProseMirror');if(e){e.removeAttribute('inputmode')}})();true;";

  private InputModeScript() {}
}

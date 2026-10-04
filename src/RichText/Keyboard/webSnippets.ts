import { PROTOCOL_TYPES, PROTOCOL_VERSION } from '../../shared/protocol';

/**
 * Scripts the custom keyboard injects into the editor WebView. They feature
 * detect the 1.1 web runtime (`window.__tentap`) and fall back to plain DOM
 * code, so legacy and custom bundles work without a rebuild. Each one is a
 * strict-mode-safe IIFE that ends in `true;` as `injectJavaScript` expects.
 */

/**
 * Sets or removes `inputmode="none"` on the editor. Must stay identical to
 * `InputModeScript.SUPPRESS` / `RESTORE` in
 * `android/src/main/java/com/tentap/InputModeScript.java`.
 */
export const INPUT_MODE_SUPPRESS_SCRIPT =
  "(function(){var t=window.__tentap;if(t&&t.setInputMode){t.setInputMode('none');return}" +
  "var e=document.querySelector('.ProseMirror');if(e){e.setAttribute('inputmode','none')}})();true;";

export const INPUT_MODE_RESTORE_SCRIPT =
  '(function(){var t=window.__tentap;if(t&&t.setInputMode){t.setInputMode(null);return}' +
  "var e=document.querySelector('.ProseMirror');if(e){e.removeAttribute('inputmode')}})();true;";

/** Window property holding the press listener state; installed once per page. */
export const PRESS_LISTENER_GLOBAL = '__tentapPress';

/**
 * Installs (once) a capture-phase tap listener that posts
 * `{type: 'tentap-editor-press'}` for a touch that ended without moving, and
 * turns it on or off. The message is tagged with the runtime's `editorId`
 * when there is one.
 */
export const pressListenerScript = (enabled: boolean): string =>
  '(function(){var w=window,d=document,s=w.' +
  PRESS_LISTENER_GLOBAL +
  ';if(!s){s=w.' +
  PRESS_LISTENER_GLOBAL +
  '={on:false,moved:false};' +
  "d.addEventListener('touchstart',function(){s.moved=false},true);" +
  "d.addEventListener('touchmove',function(){s.moved=true},true);" +
  "d.addEventListener('touchend',function(){if(!s.on||s.moved||!w.ReactNativeWebView)return;" +
  "var t=w.__tentap,m={type:'" +
  PROTOCOL_TYPES.EditorPress +
  "'};if(t&&t.editorId){m.editorId=t.editorId;m.v=" +
  PROTOCOL_VERSION +
  '}w.ReactNativeWebView.postMessage(JSON.stringify(m))},true)}' +
  's.on=' +
  String(enabled) +
  '})();true;';

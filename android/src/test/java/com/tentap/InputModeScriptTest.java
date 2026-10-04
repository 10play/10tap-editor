package com.tentap;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class InputModeScriptTest {
  @Test
  public void buildPicksTheScriptForTheRequestedState() {
    assertEquals(InputModeScript.SUPPRESS, InputModeScript.build(true));
    assertEquals(InputModeScript.RESTORE, InputModeScript.build(false));
  }

  @Test
  public void suppressPrefersTheWebRuntimeAndFallsBackToTheDom() {
    assertEquals(
        "(function(){var t=window.__tentap;if(t&&t.setInputMode){t.setInputMode('none');return}"
            + "var e=document.querySelector('.ProseMirror');if(e){e.setAttribute('inputmode','none')}})();true;",
        InputModeScript.SUPPRESS);
  }

  @Test
  public void restoreRemovesTheAttribute() {
    assertEquals(
        "(function(){var t=window.__tentap;if(t&&t.setInputMode){t.setInputMode(null);return}"
            + "var e=document.querySelector('.ProseMirror');if(e){e.removeAttribute('inputmode')}})();true;",
        InputModeScript.RESTORE);
  }
}

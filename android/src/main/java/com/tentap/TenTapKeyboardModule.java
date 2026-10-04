package com.tentap;

import android.app.Activity;
import android.content.Context;
import android.graphics.Rect;
import android.os.Build;
import android.view.View;
import android.view.ViewParent;
import android.view.Window;
import android.view.WindowManager;
import android.view.inputmethod.InputMethodManager;
import android.webkit.WebView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import java.lang.ref.WeakReference;

/**
 * Suppresses the system keyboard for the focused editor WebView while a custom
 * keyboard is shown, without moving focus away from the WebView.
 *
 * <p>All state is read and written on the UI thread.
 */
public class TenTapKeyboardModule extends TenTapKeyboardSpec implements LifecycleEventListener {
  public static final String NAME = "TenTapKeyboard";

  @Nullable private WeakReference<WebView> suppressedWebView;
  @Nullable private WeakReference<Window> overlayWindow;
  @Nullable private Integer savedSoftInputMode;

  TenTapKeyboardModule(ReactApplicationContext context) {
    super(context);
    context.addLifecycleEventListener(this);
  }

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod
  @Override
  public void setSystemKeyboardSuppressed(boolean suppressed, Promise promise) {
    UiThreadUtil.runOnUiThread(
        () -> {
          if (suppressed) {
            suppress(promise);
          } else {
            restore(promise);
          }
        });
  }

  @ReactMethod
  @Override
  public void showSystemKeyboard(Promise promise) {
    UiThreadUtil.runOnUiThread(
        () -> {
          WebView webView = focusedWebView();
          promise.resolve(webView != null && showSoftInput(webView));
        });
  }

  @ReactMethod
  @Override
  public void isSystemKeyboardVisible(Promise promise) {
    UiThreadUtil.runOnUiThread(
        () -> {
          Activity activity = getReactApplicationContext().getCurrentActivity();
          promise.resolve(activity != null && isImeVisible(activity.getWindow().getDecorView()));
        });
  }

  @ReactMethod
  @Override
  public void setWindowOverlayMode(boolean enabled, Promise promise) {
    UiThreadUtil.runOnUiThread(
        () -> {
          if (enabled) {
            promise.resolve(applyOverlayMode());
          } else {
            restoreSoftInputMode();
            promise.resolve(true);
          }
        });
  }

  @ReactMethod
  @Override
  public void getNavigationBarInset(Promise promise) {
    UiThreadUtil.runOnUiThread(
        () -> {
          Activity activity = getReactApplicationContext().getCurrentActivity();
          promise.resolve(activity != null ? navigationBarInset(activity.getWindow()) : 0d);
        });
  }

  @Override
  public void onHostResume() {}

  @Override
  public void onHostPause() {}

  @Override
  public void onHostDestroy() {
    UiThreadUtil.runOnUiThread(this::reset);
  }

  @Override
  public void invalidate() {
    getReactApplicationContext().removeLifecycleEventListener(this);
    UiThreadUtil.runOnUiThread(this::reset);
    super.invalidate();
  }

  private void suppress(Promise promise) {
    WebView webView = focusedWebView();
    if (webView == null) {
      promise.resolve(false);
      return;
    }
    releaseSuppressedWebView(webView);
    suppressedWebView = new WeakReference<>(webView);
    // inputmode="none" keeps Chromium from showing the IME again on the next
    // tap; hiding it explicitly avoids waiting for Chromium to react.
    webView.evaluateJavascript(
        InputModeScript.SUPPRESS,
        ignored -> {
          inputMethodManager().hideSoftInputFromWindow(webView.getWindowToken(), 0);
          promise.resolve(true);
        });
  }

  private void restore(Promise promise) {
    WebView focused = focusedWebView();
    releaseSuppressedWebView(focused);
    if (focused == null) {
      promise.resolve(false);
      return;
    }
    // Chromium does not show the IME when inputmode changes, so it is shown
    // explicitly, and only once the attribute is gone.
    focused.evaluateJavascript(
        InputModeScript.RESTORE, ignored -> promise.resolve(showSoftInput(focused)));
  }

  /**
   * Forgets the suppressed WebView and restores its inputmode unless it is
   * {@code next}, which the caller is about to script itself.
   */
  private void releaseSuppressedWebView(@Nullable WebView next) {
    WebView previous = suppressedWebView != null ? suppressedWebView.get() : null;
    suppressedWebView = null;
    if (previous != null && previous != next) {
      previous.evaluateJavascript(InputModeScript.RESTORE, null);
    }
  }

  private boolean showSoftInput(WebView webView) {
    webView.requestFocus();
    return inputMethodManager().showSoftInput(webView, 0);
  }

  /** The focused WebView in the activity window, or null when none is focused or a Dialog has focus. */
  @Nullable
  private WebView focusedWebView() {
    Activity activity = getReactApplicationContext().getCurrentActivity();
    View view = activity != null ? activity.getCurrentFocus() : null;
    while (view != null && !(view instanceof WebView)) {
      ViewParent parent = view.getParent();
      view = parent instanceof View ? (View) parent : null;
    }
    return view != null && view.hasWindowFocus() ? (WebView) view : null;
  }

  private InputMethodManager inputMethodManager() {
    return (InputMethodManager)
        getReactApplicationContext().getSystemService(Context.INPUT_METHOD_SERVICE);
  }

  private boolean isImeVisible(View decorView) {
    WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(decorView);
    if (insets == null) {
      return false;
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      return insets.isVisible(WindowInsetsCompat.Type.ime());
    }
    Rect visibleFrame = new Rect();
    decorView.getWindowVisibleDisplayFrame(visibleFrame);
    int[] location = new int[2];
    decorView.getLocationOnScreen(location);
    int navigationBarHeight =
        insets.getInsetsIgnoringVisibility(WindowInsetsCompat.Type.navigationBars()).bottom;
    float density = decorView.getResources().getDisplayMetrics().density;
    return KeyboardGeometry.isKeyboardCoveringFrame(
        location[1] + decorView.getHeight(),
        visibleFrame.bottom,
        navigationBarHeight,
        Math.round(KeyboardGeometry.MIN_KEYBOARD_HEIGHT_DP * density));
  }

  private double navigationBarInset(Window window) {
    View decorView = window.getDecorView();
    View content = decorView.findViewById(android.R.id.content);
    WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(decorView);
    if (content == null || insets == null) {
      return 0;
    }
    int[] decorLocation = new int[2];
    int[] contentLocation = new int[2];
    decorView.getLocationOnScreen(decorLocation);
    content.getLocationOnScreen(contentLocation);
    int overlap =
        KeyboardGeometry.navigationBarOverlap(
            contentLocation[1] + content.getHeight(),
            decorLocation[1] + decorView.getHeight(),
            insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom);
    return overlap / (double) decorView.getResources().getDisplayMetrics().density;
  }

  /**
   * Switches the activity window to ADJUST_NOTHING so the IME overlays the
   * content. Applied once per host mount, never during a keyboard switch.
   */
  private boolean applyOverlayMode() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
      return false;
    }
    Activity activity = getReactApplicationContext().getCurrentActivity();
    if (activity == null) {
      return false;
    }
    Window window = activity.getWindow();
    Window current = overlayWindow != null ? overlayWindow.get() : null;
    if (current == window) {
      return true;
    }
    restoreSoftInputMode();
    // A Dialog (e.g. an RN Modal) has focus, so the editor is not in this window.
    if (!window.getDecorView().hasWindowFocus()) {
      return false;
    }
    int mode = window.getAttributes().softInputMode;
    savedSoftInputMode = mode;
    overlayWindow = new WeakReference<>(window);
    window.setSoftInputMode(
        (mode & ~WindowManager.LayoutParams.SOFT_INPUT_MASK_ADJUST)
            | WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING);
    return true;
  }

  private void restoreSoftInputMode() {
    Window window = overlayWindow != null ? overlayWindow.get() : null;
    if (window != null && savedSoftInputMode != null) {
      window.setSoftInputMode(savedSoftInputMode);
    }
    overlayWindow = null;
    savedSoftInputMode = null;
  }

  private void reset() {
    restoreSoftInputMode();
    suppressedWebView = null;
  }
}

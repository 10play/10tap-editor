package com.tentap;

import android.app.Activity;
import android.content.Context;
import android.graphics.Rect;
import android.os.Build;
import android.os.SystemClock;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.ViewTreeObserver;
import android.view.Window;
import android.view.WindowManager;
import android.view.inputmethod.InputMethodManager;
import android.webkit.WebView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import java.lang.ref.WeakReference;

/**
 * Suppresses the system keyboard for the focused editor WebView while a custom
 * keyboard is shown, without moving focus away from the WebView.
 *
 * <p>All state is read and written on the UI thread.
 */
public class TenTapKeyboardModule extends TenTapKeyboardSpec implements LifecycleEventListener {
  public static final String NAME = "TenTapKeyboard";
  /**
   * How long a WebView that lost focus to a collapsed layout may take to get
   * a size again before it no longer takes the focus back.
   */
  private static final long COLLAPSED_FOCUS_TIMEOUT_MS = 1000;

  @Nullable private WeakReference<WebView> suppressedWebView;
  @Nullable private WeakReference<Window> overlayWindow;
  @Nullable private Integer savedSoftInputMode;
  @Nullable private WeakReference<View> observedDecorView;
  @Nullable private WeakReference<WebView> collapsedFocus;
  private long collapsedAt;
  private int imeHeight = KeyboardGeometry.HIDDEN;
  private final ViewTreeObserver.OnGlobalLayoutListener layoutListener = this::checkImeHeight;
  private final ViewTreeObserver.OnGlobalFocusChangeListener focusListener =
      this::onGlobalFocusChanged;
  private final ViewTreeObserver.OnPreDrawListener refocusListener =
      () -> {
        restoreCollapsedFocus();
        return true;
      };

  TenTapKeyboardModule(ReactApplicationContext context) {
    super(context);
    context.addLifecycleEventListener(this);
    UiThreadUtil.runOnUiThread(this::observeWindow);
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

  /**
   * React Native's {@code StatusBar.currentHeight} is read once, and is 0 when
   * that happens before the window is attached.
   */
  @ReactMethod
  @Override
  public void getStatusBarHeight(Promise promise) {
    UiThreadUtil.runOnUiThread(
        () -> {
          Activity activity = getReactApplicationContext().getCurrentActivity();
          View decorView = activity != null ? activity.getWindow().getDecorView() : null;
          WindowInsetsCompat insets =
              decorView != null ? ViewCompat.getRootWindowInsets(decorView) : null;
          if (insets == null) {
            promise.reject("E_NO_WINDOW", "The activity window is not attached");
            return;
          }
          int top =
              insets.getInsets(
                      WindowInsetsCompat.Type.statusBars()
                          | WindowInsetsCompat.Type.displayCutout())
                  .top;
          promise.resolve(top / (double) decorView.getResources().getDisplayMetrics().density);
        });
  }

  @Override
  public void onHostResume() {
    UiThreadUtil.runOnUiThread(this::observeWindow);
  }

  @Override
  public void onHostPause() {}

  @Override
  public void onHostDestroy() {
    UiThreadUtil.runOnUiThread(
        () -> {
          stopObservingWindow();
          reset();
        });
  }

  @Override
  public void invalidate() {
    getReactApplicationContext().removeLifecycleEventListener(this);
    UiThreadUtil.runOnUiThread(
        () -> {
          stopObservingWindow();
          reset();
        });
    super.invalidate();
  }

  /**
   * Watches the activity window for IME heights React Native does not report
   * (see {@link #checkImeHeight}) and for an editor WebView losing focus to a
   * collapsed layout (see {@link #onGlobalFocusChanged}).
   */
  private void observeWindow() {
    Activity activity = getReactApplicationContext().getCurrentActivity();
    View decorView = activity != null ? activity.getWindow().getDecorView() : null;
    View observed = observedDecorView != null ? observedDecorView.get() : null;
    if (decorView == null || decorView == observed) {
      return;
    }
    stopObservingWindow();
    ViewTreeObserver observer = decorView.getViewTreeObserver();
    observer.addOnGlobalFocusChangeListener(focusListener);
    observedDecorView = new WeakReference<>(decorView);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      observer.addOnGlobalLayoutListener(layoutListener);
    }
  }

  /**
   * Android clears the focus of a view laid out with no width or height, or
   * inside such a view. A layout that collapses the editor for a frame, as
   * when the window resizes for the IME before React Native padded for it,
   * then leaves the IME bound to a WebView without focus, which drops what is
   * typed. Out of touch mode (a hardware keyboard) the focus moves on to the
   * first focusable view instead, such as a back button that a key then
   * presses. The WebView that lost focus this way, still served by the IME,
   * gets it back once it has a size again, unless another text input took
   * the focus meanwhile. React Native lays its views out outside of a window
   * layout pass, so this is checked before each frame is drawn.
   */
  private void onGlobalFocusChanged(@Nullable View oldFocus, @Nullable View newFocus) {
    boolean displaced =
        newFocus == null
            || (!newFocus.onCheckIsTextEditor() && enclosingWebView(newFocus) == null);
    if (!displaced) {
      setCollapsedFocus(null);
      return;
    }
    if (collapsedFocus != null && collapsedFocus.get() != null) {
      return;
    }
    // A focus cleared during a layout pass moves on without reporting the
    // view that lost it.
    WebView webView = enclosingWebView(oldFocus);
    if (webView == null) {
      View decorView = observedDecorView != null ? observedDecorView.get() : null;
      webView = findCollapsedServedWebView(decorView);
    } else if (!isCollapsed(webView) || !inputMethodManager().isActive(webView)) {
      webView = null;
    }
    if (webView != null) {
      setCollapsedFocus(webView);
    }
  }

  /** A collapsed WebView in the tree of {@code view} that the IME still serves. */
  @Nullable
  private WebView findCollapsedServedWebView(@Nullable View view) {
    if (view instanceof WebView) {
      WebView webView = (WebView) view;
      return isCollapsed(webView) && inputMethodManager().isActive(webView) ? webView : null;
    }
    if (view instanceof ViewGroup) {
      ViewGroup group = (ViewGroup) view;
      for (int i = 0; i < group.getChildCount(); i++) {
        WebView found = findCollapsedServedWebView(group.getChildAt(i));
        if (found != null) {
          return found;
        }
      }
    }
    return null;
  }

  private void setCollapsedFocus(@Nullable WebView webView) {
    View decorView = observedDecorView != null ? observedDecorView.get() : null;
    if (decorView != null) {
      ViewTreeObserver observer = decorView.getViewTreeObserver();
      observer.removeOnPreDrawListener(refocusListener);
      if (webView != null) {
        observer.addOnPreDrawListener(refocusListener);
      }
    }
    collapsedFocus = webView != null ? new WeakReference<>(webView) : null;
    collapsedAt = SystemClock.uptimeMillis();
  }

  private void restoreCollapsedFocus() {
    WebView webView = collapsedFocus != null ? collapsedFocus.get() : null;
    if (webView == null) {
      return;
    }
    if (!webView.isAttachedToWindow()
        || SystemClock.uptimeMillis() - collapsedAt > COLLAPSED_FOCUS_TIMEOUT_MS) {
      setCollapsedFocus(null);
      return;
    }
    if (isCollapsed(webView) || !webView.hasWindowFocus()) {
      return;
    }
    setCollapsedFocus(null);
    webView.requestFocus();
  }

  /** Whether the view or one of its ancestors is hidden or has no width or height. */
  private static boolean isCollapsed(View view) {
    if (!view.isShown()) {
      return true;
    }
    for (View current = view; current != null; ) {
      if (current.getWidth() <= 0 || current.getHeight() <= 0) {
        return true;
      }
      ViewParent parent = current.getParent();
      current = parent instanceof View ? (View) parent : null;
    }
    return false;
  }

  private void stopObservingWindow() {
    View observed = observedDecorView != null ? observedDecorView.get() : null;
    if (observed != null) {
      ViewTreeObserver observer = observed.getViewTreeObserver();
      observer.removeOnGlobalLayoutListener(layoutListener);
      observer.removeOnGlobalFocusChangeListener(focusListener);
      observer.removeOnPreDrawListener(refocusListener);
    }
    observedDecorView = null;
    collapsedFocus = null;
    imeHeight = KeyboardGeometry.HIDDEN;
  }

  /**
   * From API 30 React Native sends keyboard events only when the keyboard
   * shows or hides, not when it changes height while shown (the emoji panel,
   * a suggestion strip), which would leave the toolbar under the taller
   * keyboard. Such a change is sent here as React Native sends a show.
   *
   * <p>React Native also reports a keyboard once, when the insets first show
   * it. An IME that opens with its insets still at 0 (as in landscape) is then
   * reported with no height and never again, so the height it reaches is
   * sent here too.
   */
  private void checkImeHeight() {
    View decorView = observedDecorView != null ? observedDecorView.get() : null;
    WindowInsetsCompat insets =
        decorView != null ? ViewCompat.getRootWindowInsets(decorView) : null;
    if (insets == null || !insets.isVisible(WindowInsetsCompat.Type.ime())) {
      imeHeight = KeyboardGeometry.HIDDEN;
      return;
    }
    int imeBottom = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom;
    int height = imeBottom - insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom;
    int previous = imeHeight;
    imeHeight = KeyboardGeometry.reportedKeyboardHeight(previous, height);
    if (!KeyboardGeometry.isUnreportedKeyboardHeight(previous, height)
        || !getReactApplicationContext().hasActiveReactInstance()) {
      return;
    }
    int[] location = new int[2];
    decorView.getLocationOnScreen(location);
    float density = decorView.getResources().getDisplayMetrics().density;
    WritableMap endCoordinates = Arguments.createMap();
    endCoordinates.putDouble("height", height / density);
    endCoordinates.putDouble("screenX", 0);
    endCoordinates.putDouble("width", decorView.getWidth() / density);
    endCoordinates.putDouble(
        "screenY", (location[1] + decorView.getHeight() - imeBottom) / density);
    WritableMap event = Arguments.createMap();
    event.putMap("endCoordinates", endCoordinates);
    event.putString("easing", "keyboard");
    event.putDouble("duration", 0);
    getReactApplicationContext()
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit("keyboardDidShow", event);
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
    WebView webView = enclosingWebView(activity != null ? activity.getCurrentFocus() : null);
    return webView != null && webView.hasWindowFocus() ? webView : null;
  }

  /** The view itself when it is a WebView, else the WebView it is in, if any. */
  @Nullable
  private static WebView enclosingWebView(@Nullable View view) {
    while (view != null && !(view instanceof WebView)) {
      ViewParent parent = view.getParent();
      view = parent instanceof View ? (View) parent : null;
    }
    return (WebView) view;
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
   * content. Applied when a host mounts, or on its next open when the window
   * lacked focus at mount.
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

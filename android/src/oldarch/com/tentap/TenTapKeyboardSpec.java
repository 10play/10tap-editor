package com.tentap;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/**
 * Old architecture: a hand-written mirror of src/specs/NativeTenTapKeyboard.ts.
 * scripts/check-codegen.js keeps these signatures in sync with the spec.
 */
abstract class TenTapKeyboardSpec extends ReactContextBaseJavaModule {
  TenTapKeyboardSpec(ReactApplicationContext context) {
    super(context);
  }

  @ReactMethod
  public abstract void setSystemKeyboardSuppressed(boolean suppressed, Promise promise);

  @ReactMethod
  public abstract void showSystemKeyboard(Promise promise);

  @ReactMethod
  public abstract void isSystemKeyboardVisible(Promise promise);

  @ReactMethod
  public abstract void setWindowOverlayMode(boolean enabled, Promise promise);

  @ReactMethod
  public abstract void getNavigationBarInset(Promise promise);

  @ReactMethod
  public abstract void getStatusBarHeight(Promise promise);
}

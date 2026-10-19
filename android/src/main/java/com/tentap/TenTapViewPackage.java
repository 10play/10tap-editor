package com.tentap;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.BaseReactPackage;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import java.util.Collections;

/**
 * Keeps its 1.0 class name so existing autolinking caches still resolve it. The redundant
 * `implements ReactPackage` is what RN CLI 13-15 autolinking (RN 0.74-0.76) looks for.
 */
public class TenTapViewPackage extends BaseReactPackage implements ReactPackage {
  @Nullable
  @Override
  public NativeModule getModule(@NonNull String name, @NonNull ReactApplicationContext context) {
    return TenTapKeyboardModule.NAME.equals(name) ? new TenTapKeyboardModule(context) : null;
  }

  @NonNull
  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return () ->
        Collections.singletonMap(
            TenTapKeyboardModule.NAME,
            new ReactModuleInfo(
                TenTapKeyboardModule.NAME,
                TenTapKeyboardModule.class.getName(),
                false,
                false,
                false,
                BuildConfig.IS_NEW_ARCHITECTURE_ENABLED));
  }
}

package com.tentap

import android.graphics.Color
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

@ReactModule(name = TenTapViewManager.NAME)
class TenTapViewManager :
  TenTapViewManagerSpec<TenTapView>() {
  override fun getName(): String {
    return NAME
  }

  public override fun createViewInstance(context: ThemedReactContext): TenTapView {
    return TenTapView(context)
  }

  @ReactProp(name = "color")
  override fun setColor(view: TenTapView?, color: String?) {
    view?.setBackgroundColor(Color.parseColor(color))
  }

  companion object {
    const val NAME = "TenTapView"
  }
}

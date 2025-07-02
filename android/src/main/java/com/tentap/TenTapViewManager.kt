package com.tentap

import android.content.Context
import android.graphics.Rect
import android.util.Log
import android.view.View
import android.view.Window
import android.view.WindowManager
import android.view.inputmethod.InputMethodManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.LayoutShadowNode
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.yoga.YogaDisplay


@ReactModule(name = TenTapViewManager.NAME)
class TenTapViewManager :
  TenTapViewManagerSpec<TenTapView>() {

    override fun getName(): String = NAME

    override fun createViewInstance(reactContext: ThemedReactContext): TenTapView {
        return TenTapView(reactContext)
    }

    companion object {
        const val NAME = "TenTapView"
    }
}

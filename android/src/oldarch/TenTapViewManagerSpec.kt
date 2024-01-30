package com.tentap

import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ViewGroupManager

abstract class TenTapViewManagerSpec<T : FrameLayout> : ViewGroupManager<T>() {
  abstract fun setKeyboardHeight(view: T?, value: Int)
}

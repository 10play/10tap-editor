package com.tentap

import android.view.ViewGroup
import com.facebook.react.uimanager.ViewGroupManager

abstract class TenTapViewManagerSpec<T : ViewGroup> : ViewGroupManager<T>() {
  abstract fun setRootBackground(view: TenTapView?, value: Int)
  abstract fun setInputTag(view: TenTapView?, value: Int)
  abstract fun setKeyboardID(view: TenTapView?, value: String?)
  abstract fun setKeyboardHeight(view: TenTapView?, value: Int)
}

package com.tentap

import android.view.ViewGroup

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.TenTapViewManagerDelegate
import com.facebook.react.viewmanagers.TenTapViewManagerInterface

abstract class TenTapViewManagerSpec<T : ViewGroup> : ViewGroupManager<T>(), TenTapViewManagerInterface<T> {
  private val mDelegate: ViewManagerDelegate<T>

  init {
    mDelegate = TenTapViewManagerDelegate(this)
  }

  override fun getDelegate(): ViewManagerDelegate<T>? {
    return mDelegate
  }
}

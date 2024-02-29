package com.tentap

import android.content.Context
import android.util.AttributeSet
import android.util.Log
import android.view.View
import android.view.ViewGroup

class TenTapView : ViewGroup{
  private var onChildAdded: (() -> Unit)? = null
  private var onChildRemoved: (() -> Unit)? = null

  constructor(context: Context) : super(context)
  constructor(context: Context, attrs: AttributeSet?) : super(context, attrs)
  constructor(context: Context, attrs: AttributeSet?, defStyleAttr: Int) : super(
    context,
    attrs,
    defStyleAttr
  )

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    var height = bottom - top
    Log.i("TenTapView", "Layout $changed height: $height")
  }

  override fun onViewAdded(child: View?) {
    if(childCount == 1) onChildAdded?.invoke()
    super.onViewAdded(child)
  }

  override fun onViewRemoved(child: View?) {
    if(childCount == 0) onChildRemoved?.invoke()
    super.onViewRemoved(child)
  }

  fun setOnChildAdded(callback: () -> Unit) {
    this.onChildAdded = callback
  }

  fun setOnChildRemoved(callback: () -> Unit) {
    this.onChildRemoved = callback
  }

}

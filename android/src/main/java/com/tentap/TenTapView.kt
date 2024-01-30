package com.tentap

import android.content.Context
import android.util.AttributeSet
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout

class TenTapView : FrameLayout {
  private var onChildAdded: (() -> Unit)? = null
  private var onChildRemoved: (() -> Unit)? = null

  constructor(context: Context) : super(context)
  constructor(context: Context, attrs: AttributeSet?) : super(context, attrs)
  constructor(context: Context, attrs: AttributeSet?, defStyleAttr: Int) : super(
    context,
    attrs,
    defStyleAttr
  )

  override fun onViewAdded(child: View?) {
    onChildAdded?.invoke()
    super.onViewAdded(child)
  }

  override fun onViewRemoved(child: View?) {
    onChildRemoved?.invoke()
    super.onViewRemoved(child)
  }

  fun setOnChildAdded(callback: () -> Unit) {
    this.onChildAdded = callback
  }

  fun setOnChildRemoved(callback: () -> Unit) {
    this.onChildRemoved = callback
  }
}

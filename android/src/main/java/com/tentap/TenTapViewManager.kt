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

  private fun dispatchUIUpdate(runnable: Runnable){
    UiThreadUtil.runOnUiThread(Runnable {
        runnable.run()
        var uiManagerModule = reactContext.getNativeModule(UIManagerModule::class.java)
        if(uiManagerModule != null) {
          reactContext.runOnNativeModulesQueueThread(Runnable {
            uiManagerModule.onBatchComplete()
          })
        }
    })
  }


  override fun getName(): String {
    return NAME
  }

  public override fun createViewInstance(context: ThemedReactContext): TenTapView {
    var view = TenTapView(context)

    mInputMethodManager = getInfoMethodManager(context);
    reactContext = context

    // When a child (custom keyboard) is added to our component
    // We change input mode, hide soft keyboard and show our custom keyboard
    view.setOnChildAdded {
      UiThreadUtil.runOnUiThread(
        Runnable {
          setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN)
          setCustomKeyboardVisibility(true)
          hideSoftKeyboard(view)
        })
    }

    // When child is removed, we show soft keyboard and once it is show we hide
    // our custom keyboard and change input mode
    view.setOnChildRemoved {
      showSoftKeyboard()
    }
    setupKeyboardShowListener()
    tenTapView = view
    return view
  }

  override fun createShadowNodeInstance(context: ReactApplicationContext): LayoutShadowNode {
    shadowNode = super.createShadowNodeInstance(context)
    shadowNode.setDisplay(YogaDisplay.NONE)
    return shadowNode;
  }

  private fun getInfoMethodManager(context: Context): InputMethodManager{
    return context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager;
  }

  private fun getWindow(): Window? {
    return reactContext.currentActivity?.window
  }
  private fun setSoftInputMode(mode: Int) {
    var window: Window? = getWindow()
    window?.setSoftInputMode(mode)
  }

  private fun setCustomKeyboardVisibility(visible: Boolean){
    dispatchUIUpdate(Runnable {
      customKeyboardShown = visible
      if(!visible){
        shadowNode.setDisplay(YogaDisplay.NONE)
      }else {
        shadowNode.setDisplay(YogaDisplay.FLEX)
      }
    })
  }

  private fun hideSoftKeyboard(view: TenTapView?){
    val focusedView = view?.rootView?.findFocus()
    if(focusedView != null && mInputMethodManager != null){
      mInputMethodManager.hideSoftInputFromWindow(focusedView.windowToken, 0);
    }
  }

  private fun showSoftKeyboard(){
    if(mInputMethodManager != null){
      mInputMethodManager.showSoftInput(reactContext.currentActivity?.currentFocus, 0);
    }
  }

  private fun setupKeyboardShowListener() {
    val rootView = reactContext.currentActivity?.findViewById<View>(android.R.id.content)
    rootView?.getViewTreeObserver()?.addOnGlobalLayoutListener {
      val r = Rect()
      rootView.getWindowVisibleDisplayFrame(r)
      val screenHeight = rootView.rootView.height
      val keypadHeight = screenHeight - r.bottom

      if (keypadHeight > 312) { // Threshold for keyboard visibility
        // Keyboard is shown
        onKeyboardShown()
      }
    }
  }

  private fun onKeyboardShown() {
    // After soft keyboard is shown if we are showing our custom keyboard
    // we want to update input mode and hide our keyboard
    if(customKeyboardShown){
      UiThreadUtil.runOnUiThread(Runnable {
        setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
        setCustomKeyboardVisibility(false)
      })
    }
  }



  companion object {
    const val NAME = "TenTapView"
    const val LOG_TAG = "TenTapView"
    var customKeyboardShown = false;
    lateinit var mInputMethodManager: InputMethodManager
    lateinit var reactContext: ThemedReactContext
    lateinit var shadowNode: LayoutShadowNode
    lateinit var tenTapView: TenTapView
  }
}

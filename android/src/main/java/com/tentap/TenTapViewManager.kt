package com.tentap

import android.content.Context
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
import com.facebook.react.uimanager.annotations.ReactProp
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
    mInputMethodManager = getInfoMethodManager(context);
    reactContext = context
    var view = TenTapView(context)
    view.setOnChildAdded {
      UiThreadUtil.runOnUiThread(
        Runnable {
          setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN)
          setCustomKeyboardHeight(keyboardHeight)
          hideSoftKeyboard(view)
        })
    }

    view.setOnChildRemoved {
      UiThreadUtil.runOnUiThread(
        Runnable {
          setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
          showSoftKeyboard()
          setCustomKeyboardHeight(0)
        })
    }
    tenTapView = view
    return view
  }

  override fun createShadowNodeInstance(context: ReactApplicationContext): LayoutShadowNode {
    shadowNode = super.createShadowNodeInstance(context)
    shadowNode.setDisplay(YogaDisplay.NONE)
//    shadowNode.setStyleHeight(0f)
    Log.i(LOG_TAG, "HOLA")
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

  private fun setCustomKeyboardHeight(height: Int){
    try {
      dispatchUIUpdate(Runnable {
        if(height == 0){
          shadowNode.setDisplay(YogaDisplay.NONE)
        }else {
          shadowNode.setDisplay(YogaDisplay.FLEX)
        }
      })
    }catch (e: Exception){
      Log.e(LOG_TAG, e.localizedMessage, e);
    }
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

  @ReactProp(name = "keyboardHeight")
  override fun setKeyboardHeight(view: TenTapView?, value: Int) {
    keyboardHeight = value
  }

  companion object {
    const val NAME = "TenTapView"
    const val LOG_TAG = "TenTapView"
    lateinit var mInputMethodManager: InputMethodManager
    lateinit var reactContext: ThemedReactContext
    lateinit var shadowNode: LayoutShadowNode
    lateinit var tenTapView: TenTapView
    var keyboardHeight: Int = 0
  }
}

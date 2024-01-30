package com.tentap

import android.app.Activity
import android.content.Context
import android.util.Log
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
          setKeyboardHeight(keyboardHeight)
//          setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN)
          hideSoftKeyboard(view)
        })
    }

    view.setOnChildRemoved { UiThreadUtil.runOnUiThread(
      Runnable {
        Log.i(LOG_TAG, "DID HIDE");
        setKeyboardHeight(0)
//        var mode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE or
//          WindowManager.LayoutParams.SOFT_INPUT_IS_FORWARD_NAVIGATION
//        setSoftInputMode(mode)
        showSoftKeyboard()
      })
    }
    return view
  }

  override fun createShadowNodeInstance(context: ReactApplicationContext): LayoutShadowNode {
    shadowNode = super.createShadowNodeInstance(context)
    shadowNode.setStyleHeight(0f)
    return shadowNode;
  }

  private fun getInfoMethodManager(context: Context): InputMethodManager{
    return context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager;
  }

  private fun getWindow(): Window? {
    return reactContext.currentActivity?.window
  }
  private fun setSoftInputMode(mode: Int) {
    var window = getWindow()
    if(window == null){
      Log.e(LOG_TAG, "BO")
    }
    window?.setSoftInputMode(mode)
  }

  private fun setKeyboardHeight(height: Int){
    try {
       Log.i(LOG_TAG, "SETTING H TO $height")
        dispatchUIUpdate(Runnable {
          shadowNode.setStyleHeight(keyboardHeight.toFloat())
          if(height == 0){
            shadowNode.flex = 0f
//            shadowNode.layoutParent?.calculateLayout()
          }else {
            shadowNode.flex = 1f
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
      focusedView.clearFocus()
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
    var keyboardHeight: Int = 0
  }
}

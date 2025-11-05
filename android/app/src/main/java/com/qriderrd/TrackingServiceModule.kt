package com.qriderrd

import android.content.Intent
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class TrackingServiceModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "TrackingServiceModule"

  @ReactMethod
  fun start(title: String, text: String, promise: Promise) {
    try {
      val ctx = reactContext
      val intent = Intent(ctx, TrackingService::class.java)
      intent.putExtra(TrackingService.EXTRA_TITLE, title)
      intent.putExtra(TrackingService.EXTRA_TEXT, text)
      ContextCompat.startForegroundService(ctx, intent)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("E_START_SERVICE", e)
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    try {
      val ctx = reactContext
      val intent = Intent(ctx, TrackingService::class.java)
      ctx.stopService(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("E_STOP_SERVICE", e)
    }
  }
}


package com.smsbroadcast

import android.content.Intent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class ServerServiceModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "ServerServiceModule"

    init {
        ServerForegroundService.stopCallback = {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("ServerStopRequested", null)
        }
    }

    @ReactMethod
    fun start(port: Int, promise: Promise) {
        try {
            val intent = Intent(reactContext, ServerForegroundService::class.java).apply {
                putExtra(ServerForegroundService.EXTRA_PORT, port)
            }
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent)
            } else {
                reactContext.startService(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        try {
            val intent = Intent(reactContext, ServerForegroundService::class.java)
            reactContext.stopService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun updateCount(sent: Int, errors: Int, port: Int, promise: Promise) {
        try {
            val intent = Intent(reactContext, ServerForegroundService::class.java).apply {
                action = ServerForegroundService.ACTION_UPDATE
                putExtra(ServerForegroundService.EXTRA_PORT, port)
                putExtra(ServerForegroundService.EXTRA_SENT, sent)
                putExtra(ServerForegroundService.EXTRA_ERRORS, errors)
            }
            reactContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("UPDATE_FAILED", e.message, e)
        }
    }

    // Required stubs for RN event emitter
    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}
}

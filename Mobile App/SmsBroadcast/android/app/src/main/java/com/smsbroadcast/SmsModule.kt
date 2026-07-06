package com.smsbroadcast

import android.Manifest
import android.content.pm.PackageManager
import android.telephony.SmsManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SmsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "SmsModule"

    @ReactMethod
    fun sendSms(phoneNumber: String, message: String, promise: Promise) {
        try {
            val smsManager = reactApplicationContext.getSystemService(SmsManager::class.java)
                ?: SmsManager.getDefault()

            if (message.length > 160) {
                val parts = smsManager.divideMessage(message)
                smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null)
            } else {
                smsManager.sendTextMessage(phoneNumber, null, message, null, null)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SEND_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun checkPermission(promise: Promise) {
        val permission = ContextCompat.checkSelfPermission(
            reactApplicationContext, Manifest.permission.SEND_SMS
        )
        promise.resolve(permission == PackageManager.PERMISSION_GRANTED)
    }
}
